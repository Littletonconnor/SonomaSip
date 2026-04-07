import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Pipeline tables aren't in the generated Database type yet (migration must be
 * applied first, then `pnpm db:gen-types`). Until then, we use an untyped
 * Supabase client scoped to pipeline operations only.
 *
 * TODO: after applying the migration and regenerating types, switch to
 * createServiceSupabase() from '@/lib/supabase-server' and remove this client.
 */
function pipelineClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export type PipelineStage =
  | 'discovery'
  | 'crawl'
  | 'extraction'
  | 'enrichment'
  | 'publish'
  | 'health_check';

export type PipelineRunStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface PipelineRunResult {
  id: number;
  stage: PipelineStage;
  status: PipelineRunStatus;
  wineries_processed: number;
  wineries_failed: number;
  error_summary: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export async function startRun(
  stage: PipelineStage,
  metadata: Record<string, unknown> = {},
): Promise<number> {
  const db = pipelineClient();
  const { data, error } = await db
    .from('pipeline_runs')
    .insert({ stage, metadata })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to start pipeline run: ${error?.message}`);
  }
  return data.id as number;
}

export async function completeRun(
  runId: number,
  result: {
    status: 'completed' | 'partial';
    wineries_processed: number;
    wineries_failed?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const db = pipelineClient();
  const { error } = await db
    .from('pipeline_runs')
    .update({
      status: result.status,
      wineries_processed: result.wineries_processed,
      wineries_failed: result.wineries_failed ?? 0,
      completed_at: new Date().toISOString(),
      metadata: result.metadata ?? {},
    })
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to complete pipeline run: ${error.message}`);
  }
}

export async function failRun(
  runId: number,
  errorSummary: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const db = pipelineClient();
  const { error } = await db
    .from('pipeline_runs')
    .update({
      status: 'failed',
      error_summary: errorSummary,
      completed_at: new Date().toISOString(),
      metadata,
    })
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to mark pipeline run as failed: ${error.message}`);
  }
}

export async function getLatestRun(stage: PipelineStage): Promise<PipelineRunResult | null> {
  const db = pipelineClient();
  const { data, error } = await db
    .from('pipeline_runs')
    .select('*')
    .eq('stage', stage)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get latest pipeline run: ${error.message}`);
  }
  return data as PipelineRunResult | null;
}

export async function getRunHistory(
  stage?: PipelineStage,
  limit = 20,
): Promise<PipelineRunResult[]> {
  const db = pipelineClient();
  let query = db
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (stage) {
    query = query.eq('stage', stage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get pipeline run history: ${error.message}`);
  }
  return (data ?? []) as PipelineRunResult[];
}

/**
 * Wraps a pipeline stage function with automatic run tracking.
 * Starts a run, executes the function, and marks it completed or failed.
 */
export async function withTracking<T>(
  stage: PipelineStage,
  fn: (runId: number) => Promise<{ processed: number; failed: number; result: T }>,
  metadata: Record<string, unknown> = {},
): Promise<T> {
  const runId = await startRun(stage, metadata);
  try {
    const { processed, failed, result } = await fn(runId);
    await completeRun(runId, {
      status: failed > 0 ? 'partial' : 'completed',
      wineries_processed: processed,
      wineries_failed: failed,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, message).catch(() => {});
    throw err;
  }
}
