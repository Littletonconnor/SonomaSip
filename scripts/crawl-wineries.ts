/**
 * Crawl winery websites and store raw markdown in winery_scrapes.
 *
 * Usage:
 *   pnpm pipeline:crawl                     # crawl wineries not scraped in last 30 days
 *   pnpm pipeline:crawl --winery=slug       # crawl a single winery
 *   pnpm pipeline:crawl --tier=discovered   # crawl only discovered-tier wineries
 *   pnpm pipeline:crawl --force             # ignore last_scraped_at, crawl everything
 *   pnpm pipeline:crawl --dry-run           # log what would be crawled, no API calls
 *
 * Free tier budget: 500 credits/mo. 5 pages/winery = 100 wineries/mo max.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { crawlWebsite, type CrawlPage } from '../src/lib/pipeline/crawl.js';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const WINERY_ARG = process.argv.find((a) => a.startsWith('--winery='))?.split('=')[1];
const TIER_ARG = process.argv.find((a) => a.startsWith('--tier='))?.split('=')[1];

// Skip wineries scraped within this many days (unless --force)
const SKIP_IF_SCRAPED_WITHIN_DAYS = 30;

// Pause between wineries — longer delay to stay within free tier rate limits
const DELAY_BETWEEN_WINERIES_MS = 10_000;

interface WineryRow {
  id: string;
  name: string;
  website_url: string | null;
  coverage_tier: string;
  last_scraped_at: string | null;
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`\n=== Winery Crawl${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  // Load wineries to crawl
  let query = supabase
    .from('wineries')
    .select('id, name, website_url, coverage_tier, last_scraped_at')
    .eq('is_active', true)
    .not('website_url', 'is', null);

  if (WINERY_ARG) {
    query = query.eq('id', WINERY_ARG);
  } else if (TIER_ARG) {
    query = query.eq('coverage_tier', TIER_ARG);
  }

  const { data: wineries, error: queryError } = await query.order('name');
  if (queryError) throw new Error(`Failed to load wineries: ${queryError.message}`);

  const allWineries = (wineries ?? []) as WineryRow[];

  // Skip recently scraped wineries unless --force
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SKIP_IF_SCRAPED_WITHIN_DAYS);
  const cutoffIso = cutoff.toISOString();

  let skipped = 0;
  const toProcess = allWineries.filter((w) => {
    if (FORCE || !w.last_scraped_at) return true;
    if (w.last_scraped_at > cutoffIso) {
      skipped++;
      return false;
    }
    return true;
  });

  console.log(`Wineries found: ${allWineries.length}, to crawl: ${toProcess.length}${skipped > 0 ? `, skipped (scraped <${SKIP_IF_SCRAPED_WITHIN_DAYS}d ago): ${skipped}` : ''}\n`);

  if (toProcess.length === 0) {
    console.log('Nothing to crawl.');
    return;
  }

  if (DRY_RUN) {
    for (const w of toProcess) {
      console.log(`  ${w.name} (${w.id}) — ${w.website_url} [${w.coverage_tier}]`);
    }
    console.log('\nDry run — no API calls or database writes.');
    return;
  }

  // Start pipeline run
  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      stage: 'crawl',
      metadata: {
        winery_filter: WINERY_ARG ?? TIER_ARG ?? 'all',
        total_wineries: toProcess.length,
      },
    })
    .select('id')
    .single();

  if (runError || !runData) {
    throw new Error(`Failed to start pipeline run: ${runError?.message}`);
  }
  const runId = runData.id;

  let processed = 0;
  let failed = 0;
  let totalPages = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    if (!w.website_url) {
      console.log(`${progress} ${w.name} — skipped (no URL)`);
      continue;
    }

    console.log(`${progress} ${w.name} — crawling ${w.website_url}...`);

    try {
      const result = await crawlWebsite(w.website_url);

      if (!result.success) {
        console.log(`  FAILED: ${result.error}`);
        failed++;
        continue;
      }

      console.log(`  Got ${result.pages.length} pages`);

      // Store each page
      const scrapeRows = result.pages.map((page: CrawlPage) => ({
        winery_id: w.id,
        run_id: runId,
        page_url: page.url,
        page_title: page.title,
        raw_markdown: page.markdown,
        word_count: page.wordCount,
      }));

      if (scrapeRows.length > 0) {
        const { error: insertError } = await supabase
          .from('winery_scrapes')
          .insert(scrapeRows);

        if (insertError) {
          console.log(`  Failed to store scrapes: ${insertError.message}`);
          failed++;
          continue;
        }
      }

      // Update last_scraped_at on the winery
      await supabase
        .from('wineries')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', w.id);

      totalPages += result.pages.length;
      processed++;

      for (const page of result.pages) {
        console.log(`    ${page.title ?? page.url} (${page.wordCount} words)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ERROR: ${msg}`);
      failed++;
    }

    // Delay between wineries
    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_WINERIES_MS));
    }
  }

  // Complete pipeline run
  await supabase
    .from('pipeline_runs')
    .update({
      status: failed > 0 ? 'partial' : 'completed',
      wineries_processed: processed,
      wineries_failed: failed,
      completed_at: new Date().toISOString(),
      metadata: {
        winery_filter: WINERY_ARG ?? TIER_ARG ?? 'all',
        total_wineries: toProcess.length,
        total_pages: totalPages,
      },
    })
    .eq('id', runId);

  console.log(`\nDone. Processed: ${processed}, Failed: ${failed}, Pages: ${totalPages}`);
}

run().catch((err) => {
  console.error('Crawl failed:', err);
  process.exit(1);
});
