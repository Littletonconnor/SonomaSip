/**
 * Apply approved + auto-approved content drafts to the wineries table.
 *
 * This is the final stage of the winery data pipeline. It does three things
 * in order, wrapped in a single `pipeline_runs` row with stage = 'publish':
 *
 *   1. Auto-approve sweep. Reads pending drafts, classifies each one against
 *      the auto-approve rules in `src/lib/pipeline/publish.ts`, and flips the
 *      eligible ones to status = 'auto_approved' (reviewed_by = 'pipeline').
 *
 *   2. Snapshot + apply. Groups every approved / auto-approved draft by
 *      winery, snapshots the current row to `winery_snapshots` (reason =
 *      'pipeline_publish'), then issues a single UPDATE containing every
 *      approved change for that winery plus `last_verified_at = now()` and
 *      a `coverage_tier` promotion from discovered → verified.
 *
 *   3. Cleanup. Deletes the applied draft rows so the review queue only
 *      ever shows work the admin still needs to do. The full audit trail
 *      lives in `winery_snapshots` (before-state) and `pipeline_runs`
 *      metadata (what was applied).
 *
 * Usage:
 *   pnpm pipeline:publish                    # auto-approve + apply all approved drafts
 *   pnpm pipeline:publish --winery=slug      # only a single winery
 *   pnpm pipeline:publish --auto-only        # auto-approve sweep, don't apply anything
 *   pnpm pipeline:publish --skip-auto        # apply approved drafts without the sweep
 *   pnpm pipeline:publish --dry-run          # log what would change, no DB writes
 */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '../src/lib/database.types.js';
import {
  buildWineryPatch,
  classifyDraft,
  isPublishableField,
  nextCoverageTier,
  type AutoApproveReason,
} from '../src/lib/pipeline/publish.js';

type PipelineClient = SupabaseClient<Database>;
type DraftRow = Tables<'content_drafts'>;

const DRY_RUN = process.argv.includes('--dry-run');
const AUTO_ONLY = process.argv.includes('--auto-only');
const SKIP_AUTO = process.argv.includes('--skip-auto');
const WINERY_ARG = process.argv.find((a) => a.startsWith('--winery='))?.split('=')[1];

const REVIEWER_PIPELINE = 'pipeline';

interface AutoApproveSummary {
  approved: number;
  skipped: number;
  reasons: Record<string, number>;
}

async function loadPendingDrafts(supabase: PipelineClient): Promise<DraftRow[]> {
  let query = supabase
    .from('content_drafts')
    .select('*')
    .eq('status', 'pending')
    .order('winery_id');
  if (WINERY_ARG) query = query.eq('winery_id', WINERY_ARG);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load pending drafts: ${error.message}`);
  return data ?? [];
}

async function loadApprovedDrafts(supabase: PipelineClient): Promise<DraftRow[]> {
  let query = supabase
    .from('content_drafts')
    .select('*')
    .in('status', ['approved', 'auto_approved'])
    .order('winery_id');
  if (WINERY_ARG) query = query.eq('winery_id', WINERY_ARG);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load approved drafts: ${error.message}`);
  return data ?? [];
}

async function loadWineryRow(
  supabase: PipelineClient,
  wineryId: string,
): Promise<Tables<'wineries'>> {
  const { data, error } = await supabase.from('wineries').select('*').eq('id', wineryId).single();
  if (error || !data) {
    throw new Error(`Failed to load winery ${wineryId}: ${error?.message ?? 'not found'}`);
  }
  return data;
}

async function autoApproveSweep(
  supabase: PipelineClient,
  runId: number,
): Promise<AutoApproveSummary> {
  const pending = await loadPendingDrafts(supabase);
  const summary: AutoApproveSummary = { approved: 0, skipped: 0, reasons: {} };

  if (pending.length === 0) {
    console.log('Auto-approve sweep: no pending drafts.');
    return summary;
  }

  const autoIds: number[] = [];
  for (const draft of pending) {
    const decision = classifyDraft({
      field_name: draft.field_name,
      current_value: draft.current_value,
      confidence: draft.confidence,
    });
    summary.reasons[decision.reason] = (summary.reasons[decision.reason] ?? 0) + 1;
    if (decision.auto) {
      autoIds.push(draft.id);
    } else {
      summary.skipped += 1;
    }
  }

  console.log(
    `Auto-approve sweep: ${pending.length} pending → ${autoIds.length} auto-approvable, ${summary.skipped} flagged for review`,
  );
  for (const [reason, count] of Object.entries(summary.reasons)) {
    console.log(`  ${reason}: ${count}`);
  }

  if (DRY_RUN || autoIds.length === 0) {
    summary.approved = autoIds.length;
    return summary;
  }

  const { error } = await supabase
    .from('content_drafts')
    .update({
      status: 'auto_approved',
      reviewed_by: REVIEWER_PIPELINE,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', autoIds);

  if (error) {
    throw new Error(`Failed to flip drafts to auto_approved: ${error.message}`);
  }

  summary.approved = autoIds.length;
  void runId;
  return summary;
}

interface AppliedChange {
  draft_id: number;
  field_name: string;
  before: string | null;
  after: string;
  source: AutoApproveReason | 'human';
}

interface WineryApplyResult {
  winery_id: string;
  applied: AppliedChange[];
  skipped_errors: Array<{ draft_id: number; field_name: string; error: string }>;
  snapshot_id: number | null;
  coverage_tier_before: Tables<'wineries'>['coverage_tier'];
  coverage_tier_after: Tables<'wineries'>['coverage_tier'];
}

async function applyWinery(
  supabase: PipelineClient,
  runId: number,
  wineryId: string,
  drafts: DraftRow[],
): Promise<WineryApplyResult> {
  const current = await loadWineryRow(supabase, wineryId);

  const applied: AppliedChange[] = [];
  const errors: WineryApplyResult['skipped_errors'] = [];
  const applyableDrafts: Array<{ field_name: string; proposed_value: string }> = [];

  for (const d of drafts) {
    if (!isPublishableField(d.field_name)) {
      errors.push({
        draft_id: d.id,
        field_name: d.field_name,
        error: 'unknown_publish_field',
      });
      continue;
    }
    applyableDrafts.push({ field_name: d.field_name, proposed_value: d.proposed_value });
    applied.push({
      draft_id: d.id,
      field_name: d.field_name,
      before: d.current_value,
      after: d.proposed_value,
      source: d.status === 'auto_approved' ? 'factual_high_confidence' : 'human',
    });
  }

  if (applyableDrafts.length === 0) {
    return {
      winery_id: wineryId,
      applied,
      skipped_errors: errors,
      snapshot_id: null,
      coverage_tier_before: current.coverage_tier,
      coverage_tier_after: current.coverage_tier,
    };
  }

  let patch: Record<string, unknown>;
  try {
    patch = buildWineryPatch(applyableDrafts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to build patch for ${wineryId}: ${message}`);
  }

  const nextTier = nextCoverageTier(current.coverage_tier);

  if (DRY_RUN) {
    return {
      winery_id: wineryId,
      applied,
      skipped_errors: errors,
      snapshot_id: null,
      coverage_tier_before: current.coverage_tier,
      coverage_tier_after: nextTier,
    };
  }

  const { data: snapshot, error: snapshotError } = await supabase
    .from('winery_snapshots')
    .insert({
      winery_id: wineryId,
      run_id: runId,
      snapshot: current as unknown as Json,
      reason: 'pipeline_publish',
    })
    .select('id')
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(`Failed to snapshot ${wineryId}: ${snapshotError?.message}`);
  }

  const updatePayload = {
    ...patch,
    last_verified_at: new Date().toISOString(),
    content_status: 'published' as const,
    coverage_tier: nextTier,
  };

  const { error: updateError } = await supabase
    .from('wineries')
    .update(updatePayload)
    .eq('id', wineryId);

  if (updateError) {
    throw new Error(`Failed to update ${wineryId}: ${updateError.message}`);
  }

  const draftIds = drafts.map((d) => d.id);
  const { error: deleteError } = await supabase.from('content_drafts').delete().in('id', draftIds);

  if (deleteError) {
    throw new Error(
      `Applied ${wineryId} but failed to clean up drafts ${draftIds.join(',')}: ${deleteError.message}`,
    );
  }

  return {
    winery_id: wineryId,
    applied,
    skipped_errors: errors,
    snapshot_id: snapshot.id,
    coverage_tier_before: current.coverage_tier,
    coverage_tier_after: nextTier,
  };
}

function groupByWinery(drafts: DraftRow[]): Map<string, DraftRow[]> {
  const map = new Map<string, DraftRow[]>();
  for (const d of drafts) {
    const list = map.get(d.winery_id) ?? [];
    list.push(d);
    map.set(d.winery_id, list);
  }
  return map;
}

async function startRun(
  supabase: PipelineClient,
  metadata: Record<string, unknown>,
): Promise<number> {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({ stage: 'publish', metadata: metadata as Json })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Failed to start publish run: ${error?.message}`);
  }
  return data.id as number;
}

async function completeRun(
  supabase: PipelineClient,
  runId: number,
  result: {
    status: 'completed' | 'partial' | 'failed';
    wineries_processed: number;
    wineries_failed: number;
    error_summary?: string;
    metadata: Record<string, unknown>;
  },
): Promise<void> {
  await supabase
    .from('pipeline_runs')
    .update({
      status: result.status,
      wineries_processed: result.wineries_processed,
      wineries_failed: result.wineries_failed,
      error_summary: result.error_summary ?? null,
      completed_at: new Date().toISOString(),
      metadata: result.metadata as Json,
    })
    .eq('id', runId);
}

async function run() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`\n=== Winery Publish${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);
  if (AUTO_ONLY) console.log('Mode: auto-approve sweep only (no apply).');
  if (SKIP_AUTO) console.log('Mode: skip auto-approve sweep, apply approved drafts only.');
  if (WINERY_ARG) console.log(`Winery filter: ${WINERY_ARG}`);

  const runMetadata: Record<string, unknown> = {
    winery_filter: WINERY_ARG ?? 'all',
    dry_run: DRY_RUN,
    auto_only: AUTO_ONLY,
    skip_auto: SKIP_AUTO,
  };

  const runId = DRY_RUN ? -1 : await startRun(supabase, runMetadata);

  let autoSummary: AutoApproveSummary = { approved: 0, skipped: 0, reasons: {} };
  const applyResults: WineryApplyResult[] = [];
  const failures: Array<{ winery_id: string; error: string }> = [];

  try {
    if (!SKIP_AUTO) {
      autoSummary = await autoApproveSweep(supabase, runId);
    }

    if (AUTO_ONLY) {
      console.log('\nSkipping apply stage (--auto-only).');
    } else {
      const drafts = await loadApprovedDrafts(supabase);
      const grouped = groupByWinery(drafts);
      console.log(
        `\nApply stage: ${drafts.length} approved draft(s) across ${grouped.size} winery(ies)`,
      );

      let i = 0;
      for (const [wineryId, wineryDrafts] of grouped) {
        i += 1;
        const progress = `[${i}/${grouped.size}]`;
        try {
          const result = await applyWinery(supabase, runId, wineryId, wineryDrafts);
          applyResults.push(result);
          console.log(
            `${progress} ${wineryId} — applied ${result.applied.length} field(s)` +
              (result.coverage_tier_before !== result.coverage_tier_after
                ? ` (${result.coverage_tier_before} → ${result.coverage_tier_after})`
                : '') +
              (result.skipped_errors.length > 0
                ? `, skipped ${result.skipped_errors.length} with errors`
                : ''),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.log(`${progress} ${wineryId} — FAILED: ${message}`);
          failures.push({ winery_id: wineryId, error: message });
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!DRY_RUN) {
      await completeRun(supabase, runId, {
        status: 'failed',
        wineries_processed: applyResults.length,
        wineries_failed: failures.length,
        error_summary: message,
        metadata: { ...runMetadata, auto: autoSummary },
      });
    }
    throw err;
  }

  const appliedCount = applyResults.reduce((sum, r) => sum + r.applied.length, 0);
  const status = failures.length > 0 ? 'partial' : 'completed';

  if (!DRY_RUN) {
    await completeRun(supabase, runId, {
      status,
      wineries_processed: applyResults.length,
      wineries_failed: failures.length,
      metadata: {
        ...runMetadata,
        auto: autoSummary,
        applied: applyResults.map((r) => ({
          winery_id: r.winery_id,
          snapshot_id: r.snapshot_id,
          field_count: r.applied.length,
          fields: r.applied.map((a) => a.field_name),
          coverage_tier_before: r.coverage_tier_before,
          coverage_tier_after: r.coverage_tier_after,
        })),
        failures,
      },
    });
  }

  console.log(
    `\nDone. Auto-approved: ${autoSummary.approved}, wineries updated: ${applyResults.length}, ` +
      `fields applied: ${appliedCount}, failures: ${failures.length}` +
      (DRY_RUN ? ' (dry run — no DB writes)' : ''),
  );
}

run().catch((err) => {
  console.error('Publish failed:', err);
  process.exit(1);
});
