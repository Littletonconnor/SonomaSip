/**
 * Extract structured winery data from crawled markdown via Claude Haiku.
 *
 * Reads the latest winery_scrapes row per (winery, page_url) for each
 * target winery, asks the extraction model to pull out structured fields,
 * stores the full extraction to winery_extractions, and emits content_drafts
 * for every field that differs from the current wineries row.
 *
 * Usage:
 *   pnpm pipeline:extract                     # extract wineries with scrapes, skip recent extractions
 *   pnpm pipeline:extract --winery=slug       # extract a single winery
 *   pnpm pipeline:extract --tier=editorial    # filter by coverage tier
 *   pnpm pipeline:extract --limit=5           # cap total wineries processed
 *   pnpm pipeline:extract --force             # re-extract even if recently extracted
 *   pnpm pipeline:extract --dry-run           # log what would run, no API calls or DB writes
 *
 * Requires ANTHROPIC_API_KEY in the environment at runtime.
 */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '../src/lib/database.types.js';
import type { CrawlPage } from '../src/lib/pipeline/crawl.js';
import { buildDrafts, type DraftProposal } from '../src/lib/pipeline/diff.js';
import {
  EXTRACTION_MODEL,
  EXTRACTION_SCHEMA_VERSION,
  extractWineryData,
  type ExtractionResult,
} from '../src/lib/pipeline/extract.js';

type PipelineClient = SupabaseClient<Database>;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const WINERY_ARG = process.argv.find((a) => a.startsWith('--winery='))?.split('=')[1];
const TIER_ARG = process.argv.find((a) => a.startsWith('--tier='))?.split('=')[1];
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];

const SKIP_IF_EXTRACTED_WITHIN_DAYS = 30;
const DELAY_BETWEEN_WINERIES_MS = 1_000;

interface WineryRow {
  id: string;
  name: string;
  coverage_tier: string;
  last_scraped_at: string | null;
}

async function loadWineries(supabase: PipelineClient): Promise<WineryRow[]> {
  let query = supabase
    .from('wineries')
    .select('id, name, coverage_tier, last_scraped_at')
    .eq('is_active', true);

  if (WINERY_ARG) {
    query = query.eq('id', WINERY_ARG);
  } else if (TIER_ARG) {
    query = query.eq('coverage_tier', TIER_ARG as Tables<'wineries'>['coverage_tier']);
  }

  const { data, error } = await query.order('name');
  if (error) throw new Error(`Failed to load wineries: ${error.message}`);
  return (data ?? []) as WineryRow[];
}

async function loadLatestScrapes(supabase: PipelineClient, wineryId: string): Promise<CrawlPage[]> {
  const { data, error } = await supabase
    .from('winery_scrapes')
    .select('page_url, page_title, raw_markdown, word_count, scraped_at')
    .eq('winery_id', wineryId)
    .order('scraped_at', { ascending: false });

  if (error) throw new Error(`Failed to load scrapes: ${error.message}`);

  const rows = data ?? [];
  const seen = new Set<string>();
  const pages: CrawlPage[] = [];
  for (const row of rows) {
    if (seen.has(row.page_url)) continue;
    seen.add(row.page_url);
    pages.push({
      url: row.page_url,
      title: row.page_title,
      markdown: row.raw_markdown,
      wordCount: row.word_count ?? row.raw_markdown.split(/\s+/).length,
    });
  }
  return pages;
}

async function getLatestExtractionAt(
  supabase: PipelineClient,
  wineryId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('winery_extractions')
    .select('extracted_at')
    .eq('winery_id', wineryId)
    .order('extracted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load extractions: ${error.message}`);
  return data?.extracted_at ?? null;
}

async function getCurrentWineryRow(
  supabase: PipelineClient,
  wineryId: string,
): Promise<Tables<'wineries'>> {
  const { data, error } = await supabase.from('wineries').select('*').eq('id', wineryId).single();

  if (error || !data) {
    throw new Error(`Failed to load winery row ${wineryId}: ${error?.message ?? 'not found'}`);
  }
  return data;
}

async function deletePendingDrafts(supabase: PipelineClient, wineryId: string): Promise<number> {
  const { error, count } = await supabase
    .from('content_drafts')
    .delete({ count: 'exact' })
    .eq('winery_id', wineryId)
    .eq('status', 'pending');

  if (error) throw new Error(`Failed to clear pending drafts: ${error.message}`);
  return count ?? 0;
}

async function insertExtraction(
  supabase: PipelineClient,
  wineryId: string,
  runId: number,
  extraction: ExtractionResult,
): Promise<number> {
  const { data, error } = await supabase
    .from('winery_extractions')
    .insert({
      winery_id: wineryId,
      run_id: runId,
      model_used: extraction.model,
      token_count: extraction.totalTokens,
      extracted_fields: {
        _schema_version: EXTRACTION_SCHEMA_VERSION,
        _input_tokens: extraction.inputTokens,
        _output_tokens: extraction.outputTokens,
        ...extraction.fields,
      } as unknown as Json,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert extraction: ${error?.message}`);
  }
  return data.id;
}

async function insertDrafts(
  supabase: PipelineClient,
  wineryId: string,
  extractionId: number,
  drafts: DraftProposal[],
): Promise<void> {
  if (drafts.length === 0) return;
  const rows = drafts.map((d) => ({
    winery_id: wineryId,
    extraction_id: extractionId,
    field_name: d.field_name,
    current_value: d.current_value,
    proposed_value: d.proposed_value,
    confidence: d.confidence,
    source_quote: d.source_quote,
    status: 'pending' as const,
  }));

  const { error } = await supabase.from('content_drafts').insert(rows);
  if (error) throw new Error(`Failed to insert drafts: ${error.message}`);
}

async function run() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`\n=== Winery Extraction${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);
  console.log(`Model: ${EXTRACTION_MODEL}`);
  console.log(`Schema version: ${EXTRACTION_SCHEMA_VERSION}`);
  if (!DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required (set it or pass --dry-run)');
  }

  const wineries = await loadWineries(supabase);
  if (wineries.length === 0) {
    console.log('No wineries matched the filter.');
    return;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SKIP_IF_EXTRACTED_WITHIN_DAYS);
  const cutoffIso = cutoff.toISOString();

  const candidates: Array<{ winery: WineryRow; pages: CrawlPage[] }> = [];
  let skippedNoScrapes = 0;
  let skippedRecent = 0;

  for (const w of wineries) {
    const pages = await loadLatestScrapes(supabase, w.id);
    if (pages.length === 0) {
      skippedNoScrapes++;
      continue;
    }

    if (!FORCE) {
      const lastExtractedAt = await getLatestExtractionAt(supabase, w.id);
      if (lastExtractedAt && lastExtractedAt > cutoffIso) {
        skippedRecent++;
        continue;
      }
    }

    candidates.push({ winery: w, pages });
  }

  const limit = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : candidates.length;
  const toProcess = candidates.slice(0, limit);

  console.log(
    `Wineries matched: ${wineries.length}, eligible: ${candidates.length}, to process: ${toProcess.length}` +
      (skippedNoScrapes > 0 ? `, skipped (no scrapes): ${skippedNoScrapes}` : '') +
      (skippedRecent > 0
        ? `, skipped (extracted <${SKIP_IF_EXTRACTED_WITHIN_DAYS}d ago): ${skippedRecent}`
        : '') +
      '\n',
  );

  if (toProcess.length === 0) {
    console.log('Nothing to extract.');
    return;
  }

  if (DRY_RUN) {
    for (const { winery, pages } of toProcess) {
      const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
      console.log(
        `  ${winery.name} (${winery.id}) — ${pages.length} pages, ~${totalWords} words [${winery.coverage_tier}]`,
      );
    }
    console.log('\nDry run — no Anthropic API calls or database writes.');
    return;
  }

  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      stage: 'extraction',
      metadata: {
        winery_filter: WINERY_ARG ?? TIER_ARG ?? 'all',
        total_wineries: toProcess.length,
        model: EXTRACTION_MODEL,
        schema_version: EXTRACTION_SCHEMA_VERSION,
      },
    })
    .select('id')
    .single();

  if (runError || !runData) {
    throw new Error(`Failed to start pipeline run: ${runError?.message}`);
  }
  const runId = runData.id as number;

  let processed = 0;
  let failed = 0;
  let totalDrafts = 0;
  let totalTokens = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { winery, pages } = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;
    console.log(`${progress} ${winery.name} — extracting from ${pages.length} pages...`);

    try {
      const extraction = await extractWineryData(winery.name, pages);
      totalTokens += extraction.totalTokens;

      const fieldCount = Object.keys(extraction.fields).length;
      console.log(
        `  extracted ${fieldCount} fields (${extraction.totalTokens} tokens: ${extraction.inputTokens} in, ${extraction.outputTokens} out)`,
      );

      const currentRow = await getCurrentWineryRow(supabase, winery.id);
      const drafts = buildDrafts(extraction.fields, currentRow);

      const clearedCount = await deletePendingDrafts(supabase, winery.id);
      const extractionId = await insertExtraction(supabase, winery.id, runId, extraction);
      await insertDrafts(supabase, winery.id, extractionId, drafts);

      if (clearedCount > 0) {
        console.log(`  cleared ${clearedCount} stale pending drafts`);
      }
      console.log(`  produced ${drafts.length} draft proposal(s)`);

      totalDrafts += drafts.length;
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ERROR: ${msg}`);
      failed++;
    }

    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_WINERIES_MS));
    }
  }

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
        total_drafts: totalDrafts,
        total_tokens: totalTokens,
        model: EXTRACTION_MODEL,
        schema_version: EXTRACTION_SCHEMA_VERSION,
      },
    })
    .eq('id', runId);

  console.log(
    `\nDone. Processed: ${processed}, Failed: ${failed}, Drafts: ${totalDrafts}, Tokens: ${totalTokens}`,
  );
}

run().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
