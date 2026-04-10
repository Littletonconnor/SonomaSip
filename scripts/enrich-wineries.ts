/**
 * Generate editorial content for wineries via Claude Sonnet.
 *
 * Combines the latest winery_extractions row + latest winery_scrapes pages
 * for each target winery, asks the enrichment model to generate editorial
 * content (tagline, description, insider tip, best-for tags, style scores,
 * editorial judgments), and emits content_drafts for every field that
 * differs from the current wineries row.
 *
 * Usage:
 *   pnpm pipeline:enrich                     # enrich wineries with fresh extractions
 *   pnpm pipeline:enrich --winery=slug       # enrich a single winery
 *   pnpm pipeline:enrich --tier=editorial    # filter by coverage tier
 *   pnpm pipeline:enrich --limit=5           # cap total wineries processed
 *   pnpm pipeline:enrich --force             # re-enrich even if content is fresh
 *   pnpm pipeline:enrich --dry-run           # log what would run, no API calls or DB writes
 *
 * Regeneration policy: skip a winery when the most recent enrichment draft is
 * less than STALE_CONTENT_DAYS old AND was generated from the same extraction
 * that's currently the latest. Any newer extraction triggers re-enrichment.
 *
 * Requires ANTHROPIC_API_KEY in the environment at runtime.
 */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '../src/lib/database.types.js';
import type { CrawlPage } from '../src/lib/pipeline/crawl.js';
import {
  buildEnrichmentDrafts,
  ENRICHMENT_FIELD_NAMES,
  ENRICHMENT_MODEL,
  ENRICHMENT_SCHEMA_VERSION,
  enrichWineryContent,
  STALE_CONTENT_DAYS,
  type EnrichmentContext,
  type EnrichmentDraftProposal,
  type EnrichmentResult,
} from '../src/lib/pipeline/enrich.js';
import type { ExtractedFields } from '../src/lib/pipeline/extract.js';

type PipelineClient = SupabaseClient<Database>;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const WINERY_ARG = process.argv.find((a) => a.startsWith('--winery='))?.split('=')[1];
const TIER_ARG = process.argv.find((a) => a.startsWith('--tier='))?.split('=')[1];
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];

const DELAY_BETWEEN_WINERIES_MS = 1_500;

interface WineryRow {
  id: string;
  name: string;
  coverage_tier: string;
}

interface LatestExtraction {
  id: number;
  extracted_fields: Record<string, unknown>;
  extracted_at: string;
}

async function loadWineries(supabase: PipelineClient): Promise<WineryRow[]> {
  let query = supabase.from('wineries').select('id, name, coverage_tier').eq('is_active', true);

  if (WINERY_ARG) {
    query = query.eq('id', WINERY_ARG);
  } else if (TIER_ARG) {
    query = query.eq('coverage_tier', TIER_ARG as Tables<'wineries'>['coverage_tier']);
  }

  const { data, error } = await query.order('name');
  if (error) throw new Error(`Failed to load wineries: ${error.message}`);
  return (data ?? []) as WineryRow[];
}

async function loadLatestExtraction(
  supabase: PipelineClient,
  wineryId: string,
): Promise<LatestExtraction | null> {
  const { data, error } = await supabase
    .from('winery_extractions')
    .select('id, extracted_fields, extracted_at')
    .eq('winery_id', wineryId)
    .order('extracted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load latest extraction: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as number,
    extracted_fields: (data.extracted_fields ?? {}) as Record<string, unknown>,
    extracted_at: data.extracted_at,
  };
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

interface LastEnrichmentSignal {
  lastEnrichedAt: string | null;
  lastEnrichedExtractionId: number | null;
}

async function loadLastEnrichmentSignal(
  supabase: PipelineClient,
  wineryId: string,
): Promise<LastEnrichmentSignal> {
  const { data, error } = await supabase
    .from('content_drafts')
    .select('created_at, extraction_id')
    .eq('winery_id', wineryId)
    .in('field_name', ENRICHMENT_FIELD_NAMES as unknown as string[])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load last enrichment signal: ${error.message}`);
  if (!data) return { lastEnrichedAt: null, lastEnrichedExtractionId: null };
  return {
    lastEnrichedAt: data.created_at,
    lastEnrichedExtractionId: (data.extraction_id as number | null) ?? null,
  };
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

async function deletePendingEnrichmentDrafts(
  supabase: PipelineClient,
  wineryId: string,
): Promise<number> {
  const { error, count } = await supabase
    .from('content_drafts')
    .delete({ count: 'exact' })
    .eq('winery_id', wineryId)
    .eq('status', 'pending')
    .in('field_name', ENRICHMENT_FIELD_NAMES as unknown as string[]);

  if (error) throw new Error(`Failed to clear pending enrichment drafts: ${error.message}`);
  return count ?? 0;
}

async function insertDrafts(
  supabase: PipelineClient,
  wineryId: string,
  extractionId: number,
  drafts: EnrichmentDraftProposal[],
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
  if (error) throw new Error(`Failed to insert enrichment drafts: ${error.message}`);
}

function stripExtractionMeta(fields: Record<string, unknown>): ExtractedFields {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('_')) continue;
    cleaned[key] = value;
  }
  return cleaned as ExtractedFields;
}

interface Candidate {
  winery: WineryRow;
  extraction: LatestExtraction;
  pages: CrawlPage[];
  enrichmentSignal: LastEnrichmentSignal;
}

async function run() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`\n=== Winery Enrichment${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);
  console.log(`Model: ${ENRICHMENT_MODEL}`);
  console.log(`Schema version: ${ENRICHMENT_SCHEMA_VERSION}`);
  console.log(`Staleness threshold: ${STALE_CONTENT_DAYS} days`);
  if (!DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required (set it or pass --dry-run)');
  }

  const wineries = await loadWineries(supabase);
  if (wineries.length === 0) {
    console.log('No wineries matched the filter.');
    return;
  }

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_CONTENT_DAYS);
  const staleCutoffIso = staleCutoff.toISOString();

  const candidates: Candidate[] = [];
  let skippedNoExtraction = 0;
  let skippedNoScrapes = 0;
  let skippedFresh = 0;

  for (const w of wineries) {
    const extraction = await loadLatestExtraction(supabase, w.id);
    if (!extraction) {
      skippedNoExtraction++;
      continue;
    }

    const pages = await loadLatestScrapes(supabase, w.id);
    if (pages.length === 0) {
      skippedNoScrapes++;
      continue;
    }

    const enrichmentSignal = await loadLastEnrichmentSignal(supabase, w.id);

    if (!FORCE) {
      const isFresh =
        enrichmentSignal.lastEnrichedAt !== null &&
        enrichmentSignal.lastEnrichedAt > staleCutoffIso;
      const sameExtraction =
        enrichmentSignal.lastEnrichedExtractionId !== null &&
        enrichmentSignal.lastEnrichedExtractionId === extraction.id;
      if (isFresh && sameExtraction) {
        skippedFresh++;
        continue;
      }
    }

    candidates.push({ winery: w, extraction, pages, enrichmentSignal });
  }

  const limit = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : candidates.length;
  const toProcess = candidates.slice(0, limit);

  console.log(
    `Wineries matched: ${wineries.length}, eligible: ${candidates.length}, to process: ${toProcess.length}` +
      (skippedNoExtraction > 0 ? `, skipped (no extraction): ${skippedNoExtraction}` : '') +
      (skippedNoScrapes > 0 ? `, skipped (no scrapes): ${skippedNoScrapes}` : '') +
      (skippedFresh > 0 ? `, skipped (fresh enrichment): ${skippedFresh}` : '') +
      '\n',
  );

  if (toProcess.length === 0) {
    console.log('Nothing to enrich.');
    return;
  }

  if (DRY_RUN) {
    for (const { winery, pages, extraction } of toProcess) {
      const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
      console.log(
        `  ${winery.name} (${winery.id}) — extraction #${extraction.id}, ${pages.length} pages, ~${totalWords} words [${winery.coverage_tier}]`,
      );
    }
    console.log('\nDry run — no Anthropic API calls or database writes.');
    return;
  }

  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      stage: 'enrichment',
      metadata: {
        winery_filter: WINERY_ARG ?? TIER_ARG ?? 'all',
        total_wineries: toProcess.length,
        model: ENRICHMENT_MODEL,
        schema_version: ENRICHMENT_SCHEMA_VERSION,
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
    const { winery, extraction, pages } = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;
    console.log(
      `${progress} ${winery.name} — enriching from extraction #${extraction.id} + ${pages.length} pages...`,
    );

    try {
      const currentRow = await getCurrentWineryRow(supabase, winery.id);
      const context: EnrichmentContext = {
        name: currentRow.name,
        ava_primary: currentRow.ava_primary,
        ava_secondary: currentRow.ava_secondary,
        nearest_town: currentRow.nearest_town,
        signature_wines: currentRow.signature_wines,
        ownership_type: currentRow.ownership_type,
        winery_scale: currentRow.winery_scale,
        tasting_room_vibe: currentRow.tasting_room_vibe,
        production_size: currentRow.production_size,
        annual_cases: currentRow.annual_cases,
      };

      const extractedFields = stripExtractionMeta(extraction.extracted_fields);
      const enrichment: EnrichmentResult = await enrichWineryContent(
        context,
        extractedFields,
        pages,
      );
      totalTokens += enrichment.totalTokens;

      const fieldCount = Object.keys(enrichment.fields).length;
      console.log(
        `  generated ${fieldCount} fields (${enrichment.totalTokens} tokens: ${enrichment.inputTokens} in, ${enrichment.outputTokens} out)`,
      );

      const drafts = buildEnrichmentDrafts(enrichment.fields, currentRow);
      const clearedCount = await deletePendingEnrichmentDrafts(supabase, winery.id);
      await insertDrafts(supabase, winery.id, extraction.id, drafts);

      if (clearedCount > 0) {
        console.log(`  cleared ${clearedCount} stale pending enrichment drafts`);
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
        model: ENRICHMENT_MODEL,
        schema_version: ENRICHMENT_SCHEMA_VERSION,
      } as Json,
    })
    .eq('id', runId);

  console.log(
    `\nDone. Processed: ${processed}, Failed: ${failed}, Drafts: ${totalDrafts}, Tokens: ${totalTokens}`,
  );
}

run().catch((err) => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
