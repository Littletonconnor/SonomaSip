/**
 * End-to-end winery data pipeline orchestrator.
 *
 * Chains the individual stage scripts into a single command:
 *
 *   discovery → crawl → extract → enrich → publish (auto-approve + apply)
 *
 * Each stage is spawned as its own tsx subprocess so that the orchestrator
 * doesn't duplicate the per-stage logic (skip-if-recent windows, retry loops,
 * `pipeline_runs` tracking, draft cleanup, etc.). Substages log to this
 * process's stdout/stderr in real time. A stage failure stops the pipeline
 * unless `--continue-on-error` is passed; regardless, a final summary table
 * is printed with status and wall-clock duration per stage.
 *
 * Usage:
 *   pnpm pipeline:run                            # discovery + crawl + extract + enrich + publish
 *   pnpm pipeline:run --dry-run                  # forward --dry-run to every stage
 *   pnpm pipeline:run --winery=<id>              # per-winery run (skips discovery)
 *   pnpm pipeline:run --tier=editorial           # limit crawl/extract/enrich to a tier
 *   pnpm pipeline:run --limit=5                  # cap extract/enrich batch size
 *   pnpm pipeline:run --only=crawl,extract       # run only the listed stages (comma-separated)
 *   pnpm pipeline:run --skip=discovery,publish   # skip the listed stages
 *   pnpm pipeline:run --force                    # forward --force where supported
 *   pnpm pipeline:run --continue-on-error        # keep running after a stage fails
 *
 * Stages skipped automatically:
 *   - discovery is skipped when --winery=<id> is passed (discovery is global,
 *     not per-winery)
 *
 * Exit codes:
 *   0 — every non-skipped stage completed
 *   1 — one or more stages failed (with or without --continue-on-error)
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type StageName = 'discovery' | 'crawl' | 'extract' | 'enrich' | 'publish';

interface StageDef {
  name: StageName;
  script: string;
  perWinery: boolean;
  supportsTier: boolean;
  supportsLimit: boolean;
  supportsForce: boolean;
}

const STAGES: StageDef[] = [
  {
    name: 'discovery',
    script: 'scripts/discover-osm.ts',
    perWinery: false,
    supportsTier: false,
    supportsLimit: false,
    supportsForce: false,
  },
  {
    name: 'crawl',
    script: 'scripts/crawl-wineries.ts',
    perWinery: true,
    supportsTier: true,
    supportsLimit: false,
    supportsForce: true,
  },
  {
    name: 'extract',
    script: 'scripts/extract-wineries.ts',
    perWinery: true,
    supportsTier: true,
    supportsLimit: true,
    supportsForce: true,
  },
  {
    name: 'enrich',
    script: 'scripts/enrich-wineries.ts',
    perWinery: true,
    supportsTier: true,
    supportsLimit: true,
    supportsForce: true,
  },
  {
    name: 'publish',
    script: 'scripts/publish-wineries.ts',
    perWinery: true,
    supportsTier: false,
    supportsLimit: false,
    supportsForce: false,
  },
];

interface CliArgs {
  dryRun: boolean;
  winery: string | null;
  tier: string | null;
  limit: string | null;
  force: boolean;
  only: Set<StageName> | null;
  skip: Set<StageName>;
  continueOnError: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    winery: null,
    tier: null,
    limit: null,
    force: false,
    only: null,
    skip: new Set(),
    continueOnError: false,
  };

  for (const raw of argv) {
    if (raw === '--dry-run') args.dryRun = true;
    else if (raw === '--force') args.force = true;
    else if (raw === '--continue-on-error') args.continueOnError = true;
    else if (raw.startsWith('--winery=')) args.winery = raw.slice('--winery='.length);
    else if (raw.startsWith('--tier=')) args.tier = raw.slice('--tier='.length);
    else if (raw.startsWith('--limit=')) args.limit = raw.slice('--limit='.length);
    else if (raw.startsWith('--only=')) {
      args.only = new Set(splitStageList(raw.slice('--only='.length)));
    } else if (raw.startsWith('--skip=')) {
      for (const s of splitStageList(raw.slice('--skip='.length))) {
        args.skip.add(s);
      }
    }
  }

  return args;
}

function splitStageList(value: string): StageName[] {
  const valid = new Set<StageName>(['discovery', 'crawl', 'extract', 'enrich', 'publish']);
  const result: StageName[] = [];
  for (const token of value.split(',')) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (!valid.has(trimmed as StageName)) {
      throw new Error(`Unknown stage "${trimmed}". Valid stages: ${Array.from(valid).join(', ')}`);
    }
    result.push(trimmed as StageName);
  }
  return result;
}

function buildStageArgs(stage: StageDef, cli: CliArgs): string[] {
  const out: string[] = [];
  if (cli.dryRun) out.push('--dry-run');
  if (cli.force && stage.supportsForce) out.push('--force');
  if (cli.winery && stage.perWinery) out.push(`--winery=${cli.winery}`);
  if (cli.tier && stage.supportsTier) out.push(`--tier=${cli.tier}`);
  if (cli.limit && stage.supportsLimit) out.push(`--limit=${cli.limit}`);
  return out;
}

interface StageRunResult {
  stage: StageName;
  status: 'completed' | 'failed' | 'skipped';
  durationMs: number;
  skipReason?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
}

function runStage(
  stage: StageDef,
  stageArgs: string[],
  repoRoot: string,
): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', stage.script, ...stageArgs], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    child.on('error', (err) => reject(err));
    child.on('exit', (code, signal) => resolve({ exitCode: code, signal }));
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds - minutes * 60;
  return `${minutes}m${remSeconds.toFixed(0).padStart(2, '0')}s`;
}

function printHeader(cli: CliArgs, plannedStages: StageName[]): void {
  console.log(`\n=== Winery Data Pipeline${cli.dryRun ? ' (DRY RUN)' : ''} ===\n`);
  console.log(`Stages: ${plannedStages.join(' → ')}`);
  if (cli.winery) console.log(`Winery filter: ${cli.winery}`);
  if (cli.tier) console.log(`Tier filter: ${cli.tier}`);
  if (cli.limit) console.log(`Limit: ${cli.limit}`);
  if (cli.force) console.log(`Force: enabled (forwarded to stages that support it)`);
  if (cli.continueOnError) console.log(`Continue on error: enabled`);
  console.log('');
}

function printSummary(results: StageRunResult[]): void {
  console.log('\n=== Pipeline Summary ===\n');

  const stageCol = Math.max(5, ...results.map((r) => r.stage.length));
  const statusCol = 9;
  const durationCol = 8;

  console.log(
    'Stage'.padEnd(stageCol) +
      '  ' +
      'Status'.padEnd(statusCol) +
      '  ' +
      'Duration'.padEnd(durationCol) +
      '  Notes',
  );
  console.log('-'.repeat(stageCol + statusCol + durationCol + 30));

  for (const r of results) {
    const notes =
      r.status === 'skipped'
        ? (r.skipReason ?? '')
        : r.status === 'failed'
          ? r.signal
            ? `signal ${r.signal}`
            : `exit ${r.exitCode ?? '?'}`
          : '';
    console.log(
      r.stage.padEnd(stageCol) +
        '  ' +
        r.status.padEnd(statusCol) +
        '  ' +
        formatDuration(r.durationMs).padEnd(durationCol) +
        '  ' +
        notes,
    );
  }

  const completed = results.filter((r) => r.status === 'completed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  console.log('');
  console.log(`Completed: ${completed}, Failed: ${failed}, Skipped: ${skipped}`);
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));

  const __filename = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(__filename), '..');

  const plannedStages: StageName[] = STAGES.filter((s) => {
    if (cli.only && !cli.only.has(s.name)) return false;
    if (cli.skip.has(s.name)) return false;
    return true;
  }).map((s) => s.name);

  if (plannedStages.length === 0) {
    console.error('No stages to run (check --only / --skip).');
    process.exit(1);
  }

  printHeader(cli, plannedStages);

  const results: StageRunResult[] = [];
  let aborted = false;

  for (const stage of STAGES) {
    if (!plannedStages.includes(stage.name)) continue;

    if (aborted) {
      results.push({ stage: stage.name, status: 'skipped', durationMs: 0, skipReason: 'aborted' });
      continue;
    }

    if (cli.winery && !stage.perWinery) {
      console.log(`[${stage.name}] skipped — stage is global, --winery was provided\n`);
      results.push({
        stage: stage.name,
        status: 'skipped',
        durationMs: 0,
        skipReason: '--winery set',
      });
      continue;
    }

    const stageArgs = buildStageArgs(stage, cli);
    console.log(
      `[${stage.name}] starting: npx tsx ${stage.script}${stageArgs.length ? ' ' + stageArgs.join(' ') : ''}`,
    );

    const startedAt = Date.now();
    try {
      const { exitCode, signal } = await runStage(stage, stageArgs, repoRoot);
      const durationMs = Date.now() - startedAt;

      if (exitCode === 0) {
        console.log(`[${stage.name}] completed in ${formatDuration(durationMs)}\n`);
        results.push({ stage: stage.name, status: 'completed', durationMs, exitCode });
      } else {
        console.log(
          `[${stage.name}] FAILED (${signal ? `signal ${signal}` : `exit ${exitCode}`}) after ${formatDuration(durationMs)}\n`,
        );
        results.push({
          stage: stage.name,
          status: 'failed',
          durationMs,
          exitCode,
          signal,
        });
        if (!cli.continueOnError) aborted = true;
      }
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[${stage.name}] FAILED to spawn: ${message}\n`);
      results.push({ stage: stage.name, status: 'failed', durationMs });
      if (!cli.continueOnError) aborted = true;
    }
  }

  printSummary(results);

  const anyFailed = results.some((r) => r.status === 'failed');
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('Pipeline orchestrator crashed:', err);
  process.exit(1);
});
