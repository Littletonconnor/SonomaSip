/**
 * Merge winery discoveries from all sources into a unified view.
 *
 * Reads winery_registry, cross-references against the wineries table,
 * and reports coverage statistics. With --promote, creates stub rows
 * in the wineries table for unmatched discoveries (coverage_tier=discovered).
 *
 * Usage:
 *   pnpm discover:merge             # report only
 *   pnpm discover:merge --promote   # create stub winery rows for unmatched
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeName } from '../src/lib/pipeline/dedup.js';

const PROMOTE = process.argv.includes('--promote');

interface RegistryRow {
  id: number;
  name: string;
  normalized_name: string;
  source: string;
  source_id: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  matched_winery_id: string | null;
  coverage_tier: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log('\n=== Merge Discoveries ===\n');

  // Load registry
  const { data: registry, error: regError } = await supabase
    .from('winery_registry')
    .select('*')
    .order('name');

  if (regError) throw new Error(`Failed to load registry: ${regError.message}`);
  const rows = (registry ?? []) as RegistryRow[];

  // Load existing winery IDs
  const { data: existingData, error: exError } = await supabase
    .from('wineries')
    .select('id, name');

  if (exError) throw new Error(`Failed to load wineries: ${exError.message}`);
  const existingIds = new Set((existingData ?? []).map((w) => w.id));

  // Stats
  const matched = rows.filter((r) => r.matched_winery_id != null);
  const unmatched = rows.filter((r) => r.matched_winery_id == null);

  const bySrc = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1;
    return acc;
  }, {});

  console.log(`Registry: ${rows.length} entries`);
  console.log(`  By source: ${Object.entries(bySrc).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  Matched to existing wineries: ${matched.length}`);
  console.log(`  Unmatched (new discoveries):  ${unmatched.length}`);
  console.log(`  Existing wineries in DB:      ${existingIds.size}\n`);

  if (unmatched.length > 0) {
    console.log('Unmatched discoveries:');
    for (const r of unmatched) {
      console.log(
        `  ${r.name} [${r.source}]` +
          (r.latitude ? ` (${r.latitude.toFixed(4)}, ${r.longitude?.toFixed(4)})` : '') +
          (r.website_url ? ` ${r.website_url}` : ''),
      );
    }
    console.log();
  }

  if (!PROMOTE) {
    console.log('Run with --promote to create stub winery rows for unmatched discoveries.');
    return;
  }

  // Promote unmatched discoveries to stub wineries
  console.log('Promoting unmatched discoveries to stub wineries...\n');
  let created = 0;
  let skipped = 0;

  for (const r of unmatched) {
    const slug = slugify(r.name);

    if (existingIds.has(slug)) {
      console.log(`  Skipped ${r.name} — slug "${slug}" already exists`);
      skipped++;
      continue;
    }

    if (r.latitude == null || r.longitude == null) {
      console.log(`  Skipped ${r.name} — no coordinates`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('wineries').insert({
      id: slug,
      slug,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      website_url: r.website_url,
      ava_primary: 'sonoma_valley', // placeholder — needs manual assignment
      reservation_type: 'reservations_recommended', // safe default
      hours: {},
      coverage_tier: 'discovered',
      content_status: 'draft',
      data_sources: [{ source: r.source, source_id: r.source_id }],
    });

    if (error) {
      console.error(`  Failed to create ${r.name}: ${error.message}`);
    } else {
      // Update registry to link to the new winery
      await supabase
        .from('winery_registry')
        .update({ matched_winery_id: slug, coverage_tier: 'discovered' })
        .eq('id', r.id);

      existingIds.add(slug);
      created++;
      console.log(`  Created ${slug}`);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error('Merge failed:', err);
  process.exit(1);
});
