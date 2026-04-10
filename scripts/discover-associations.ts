/**
 * Discover wineries from wine association member directories.
 *
 * Fetches public HTML directories from Sonoma County Vintners and Wine Road,
 * extracts member names + website links, deduplicates against existing
 * wineries in the database, and inserts new discoveries into winery_registry.
 *
 * Association pages are sometimes gated behind bot challenges. When a live
 * fetch is blocked, pass `--fixture=<path>` to parse a local HTML snapshot
 * instead. Pass `--url=<url>` to override the default directory URL.
 *
 * Usage:
 *   pnpm discover:associations                         # scrape all sources
 *   pnpm discover:associations --dry-run               # parse + dedup only
 *   pnpm discover:associations --source=sonoma_vintners
 *   pnpm discover:associations --source=wine_road
 *   pnpm discover:associations --source=sonoma_vintners --fixture=./scv.html
 *   pnpm discover:associations --source=wine_road --url=https://...
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { extractDomain, findBestMatch, type WineryCandidate } from '../src/lib/pipeline/dedup.js';
import {
  ASSOCIATION_SOURCES,
  parseAssociationHtml,
  type AssociationSourceConfig,
  type AssociationSourceKey,
  type ParsedMember,
} from '../src/lib/pipeline/associations.js';

interface CliArgs {
  dryRun: boolean;
  source: AssociationSourceKey | null;
  urlOverride: string | null;
  fixturePath: string | null;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    source: null,
    urlOverride: null,
    fixturePath: null,
    verbose: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg.startsWith('--source=')) {
      const v = arg.slice('--source='.length);
      if (v !== 'sonoma_vintners' && v !== 'wine_road') {
        throw new Error(`Invalid --source=${v}. Must be sonoma_vintners or wine_road.`);
      }
      args.source = v;
    } else if (arg.startsWith('--url=')) {
      args.urlOverride = arg.slice('--url='.length);
    } else if (arg.startsWith('--fixture=')) {
      args.fixturePath = arg.slice('--fixture='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.fixturePath && !args.source) {
    throw new Error('--fixture requires --source to tell the parser which config to use.');
  }
  if (args.urlOverride && !args.source) {
    throw new Error('--url requires --source to target a single source.');
  }

  return args;
}

const USER_AGENT = 'Mozilla/5.0 (compatible; SonomaSipBot/1.0; +https://sonomasip.com/bot)';

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`${url} → HTTP ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function loadHtml(
  config: AssociationSourceConfig,
  args: CliArgs,
): Promise<{ html: string; sourceUrl: string }> {
  if (args.fixturePath) {
    const html = await readFile(args.fixturePath, 'utf8');
    return { html, sourceUrl: args.urlOverride ?? `file://${args.fixturePath}` };
  }

  const urls = args.urlOverride ? [args.urlOverride] : config.defaultUrls;
  const errors: string[] = [];

  for (const url of urls) {
    try {
      console.log(`  Fetching ${url}`);
      const html = await fetchHtml(url);
      return { html, sourceUrl: url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`    failed: ${msg}`);
    }
  }

  throw new Error(
    `All fetch attempts for ${config.label} failed:\n  - ${errors.join('\n  - ')}\n` +
      `Hint: pass --fixture=<path> with a local HTML snapshot if the site blocks automated requests.`,
  );
}

async function loadExistingWineries(): Promise<(WineryCandidate & { id: string })[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('wineries')
    .select('id, name, latitude, longitude, website_url')
    .eq('is_active', true);

  if (error) throw new Error(`Failed to load wineries: ${error.message}`);
  return (data ?? []) as (WineryCandidate & { id: string })[];
}

interface ProcessResult {
  config: AssociationSourceConfig;
  sourceUrl: string;
  parsed: ParsedMember[];
  matched: { member: ParsedMember; existingId: string; reasons: string[] }[];
  newDiscoveries: ParsedMember[];
}

async function processSource(
  config: AssociationSourceConfig,
  args: CliArgs,
  existing: (WineryCandidate & { id: string })[],
): Promise<ProcessResult> {
  console.log(`\n--- ${config.label} (${config.source}) ---`);

  const { html, sourceUrl } = await loadHtml(config, args);
  console.log(`  Loaded ${html.length.toLocaleString()} chars from ${sourceUrl}`);

  const parsed = parseAssociationHtml(html, config, sourceUrl);
  console.log(`  Parsed ${parsed.length} candidate member listings`);

  const matched: ProcessResult['matched'] = [];
  const newDiscoveries: ParsedMember[] = [];

  for (const member of parsed) {
    const candidate: WineryCandidate = {
      name: member.name,
      website_url: member.website_url ?? undefined,
    };
    const best = findBestMatch(candidate, existing);
    if (best) {
      matched.push({
        member,
        existingId: existing[best.index].id,
        reasons: best.result.reasons,
      });
    } else {
      newDiscoveries.push(member);
    }
  }

  console.log(`  Matched to existing: ${matched.length}`);
  console.log(`  New discoveries:     ${newDiscoveries.length}`);

  if (args.verbose) {
    if (matched.length > 0) {
      console.log('  Matches:');
      for (const m of matched) {
        console.log(`    ${m.member.name} → ${m.existingId} (${m.reasons.join(', ')})`);
      }
    }
    if (newDiscoveries.length > 0) {
      console.log('  New:');
      for (const d of newDiscoveries) {
        const domain = extractDomain(d.website_url);
        const suffix = domain ?? (d.detail_url ? `detail:${d.detail_url}` : '');
        console.log(`    ${d.name}${suffix ? ` [${suffix}]` : ''}`);
      }
    }
  }

  return { config, sourceUrl, parsed, matched, newDiscoveries };
}

async function writeResults(results: ProcessResult[]): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      stage: 'discovery',
      metadata: {
        source: 'associations',
        sources: results.map((r) => ({
          source: r.config.source,
          url: r.sourceUrl,
          parsed: r.parsed.length,
          matched: r.matched.length,
          new_discoveries: r.newDiscoveries.length,
        })),
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

  for (const result of results) {
    for (const m of result.matched) {
      const { error } = await supabase.from('winery_registry').upsert(
        {
          name: m.member.name,
          normalized_name: m.member.normalized_name,
          source: m.member.source,
          source_id: m.member.source_id,
          website_url: m.member.website_url ?? m.member.detail_url,
          latitude: null,
          longitude: null,
          matched_winery_id: m.existingId,
          coverage_tier: 'editorial',
        },
        { onConflict: 'source,source_id', ignoreDuplicates: false },
      );
      if (error) {
        console.error(`  Failed to upsert ${m.member.name}: ${error.message}`);
        failed++;
      } else {
        processed++;
      }
    }

    for (const d of result.newDiscoveries) {
      const { error } = await supabase.from('winery_registry').upsert(
        {
          name: d.name,
          normalized_name: d.normalized_name,
          source: d.source,
          source_id: d.source_id,
          website_url: d.website_url ?? d.detail_url,
          latitude: null,
          longitude: null,
          matched_winery_id: null,
          coverage_tier: 'discovered',
        },
        { onConflict: 'source,source_id', ignoreDuplicates: false },
      );
      if (error) {
        console.error(`  Failed to insert ${d.name}: ${error.message}`);
        failed++;
      } else {
        processed++;
      }
    }
  }

  const totalMatched = results.reduce((n, r) => n + r.matched.length, 0);
  const totalNew = results.reduce((n, r) => n + r.newDiscoveries.length, 0);

  await supabase
    .from('pipeline_runs')
    .update({
      status: failed > 0 ? 'partial' : 'completed',
      wineries_processed: processed,
      wineries_failed: failed,
      completed_at: new Date().toISOString(),
      metadata: {
        source: 'associations',
        sources: results.map((r) => ({
          source: r.config.source,
          url: r.sourceUrl,
          parsed: r.parsed.length,
          matched: r.matched.length,
          new_discoveries: r.newDiscoveries.length,
        })),
        totals: {
          parsed: results.reduce((n, r) => n + r.parsed.length, 0),
          matched: totalMatched,
          new_discoveries: totalNew,
        },
      },
    })
    .eq('id', runId);

  console.log(`\nWrote ${processed} registry rows (${failed} failed). Run id=${runId}`);
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log(`\n=== Association Winery Discovery${args.dryRun ? ' (DRY RUN)' : ''} ===`);

  const sourcesToRun: AssociationSourceConfig[] = args.source
    ? [ASSOCIATION_SOURCES[args.source]]
    : Object.values(ASSOCIATION_SOURCES);

  const existing = await loadExistingWineries();
  console.log(`\nLoaded ${existing.length} existing wineries from DB`);

  const results: ProcessResult[] = [];
  const sourceErrors: string[] = [];

  for (const config of sourcesToRun) {
    try {
      const result = await processSource(config, args, existing);
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n[${config.source}] failed:\n  ${msg}`);
      sourceErrors.push(`${config.source}: ${msg}`);
    }
  }

  const totalParsed = results.reduce((n, r) => n + r.parsed.length, 0);
  const totalMatched = results.reduce((n, r) => n + r.matched.length, 0);
  const totalNew = results.reduce((n, r) => n + r.newDiscoveries.length, 0);

  console.log('\n=== Summary ===');
  console.log(`  Sources attempted: ${sourcesToRun.length}`);
  console.log(`  Sources succeeded: ${results.length}`);
  console.log(`  Total parsed:      ${totalParsed}`);
  console.log(`  Total matched:     ${totalMatched}`);
  console.log(`  New discoveries:   ${totalNew}`);

  if (args.dryRun) {
    console.log('\nDry run — no database writes.');
  } else if (results.length > 0) {
    await writeResults(results);
  } else {
    console.log('\nNo sources succeeded — nothing to write.');
  }

  if (sourceErrors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
