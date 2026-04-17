/**
 * Discover wineries from OpenStreetMap via the Overpass API.
 *
 * Queries for winery-tagged nodes/ways within the Sonoma County bounding box,
 * dedups against existing `wineries` rows by name + coords + domain, and
 * writes directly to the `wineries` table:
 *   - Existing editorial rows that match an OSM element get their
 *     osm_type/osm_id stamped on, linking them for future idempotent runs.
 *   - Brand-new OSM elements become minimal wineries rows (name, slug,
 *     coords, website_url, phone, address). Editorial fields (ava_primary,
 *     reservation_type, style scores, flights, varietals) are left null
 *     for admin to fill in.
 *
 * Usage:
 *   pnpm discover:osm            # run discovery
 *   pnpm discover:osm --dry-run  # query + dedup only, no DB writes
 */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types.js';
import {
  normalizeName,
  extractDomain,
  findBestMatch,
  type WineryCandidate,
} from '../src/lib/pipeline/dedup.js';

type PipelineClient = SupabaseClient<Database>;

const DRY_RUN = process.argv.includes('--dry-run');

const BBOX = {
  south: 38.1,
  west: -123.1,
  north: 38.85,
  east: -122.4,
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

async function queryOverpass(): Promise<OverpassElement[]> {
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"="winery"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      way["amenity"="winery"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      node["craft"="winery"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      way["craft"="winery"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      node["tourism"="wine_cellar"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      way["tourism"="wine_cellar"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
    );
    out center;
  `;

  console.log('Querying Overpass API...');
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OverpassResponse;
  console.log(`  Found ${data.elements.length} raw elements`);
  return data.elements;
}

interface ParsedWinery {
  osm_type: string;
  osm_id: number;
  name: string;
  normalized_name: string;
  latitude: number;
  longitude: number;
  website_url: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
}

function parseElements(elements: OverpassElement[]): ParsedWinery[] {
  const results: ParsedWinery[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;

    const key = `${normalizeName(name)}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const street = [el.tags?.['addr:housenumber'], el.tags?.['addr:street']]
      .filter(Boolean)
      .join(' ')
      .trim();

    results.push({
      osm_type: el.type,
      osm_id: el.id,
      name,
      normalized_name: normalizeName(name),
      latitude: lat,
      longitude: lon,
      website_url: el.tags?.website || el.tags?.['contact:website'] || el.tags?.url || null,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      address_street: street || null,
      address_city: el.tags?.['addr:city'] || null,
    });
  }

  return results;
}

interface ExistingWinery extends WineryCandidate {
  id: string;
  slug: string;
  osm_type: string | null;
  osm_id: number | null;
}

async function loadExistingWineries(supabase: PipelineClient): Promise<ExistingWinery[]> {
  const { data, error } = await supabase
    .from('wineries')
    .select('id, slug, name, latitude, longitude, website_url, osm_type, osm_id');

  if (error) throw new Error(`Failed to load wineries: ${error.message}`);
  return (data ?? []) as unknown as ExistingWinery[];
}

/**
 * Kebab-case a name for use as a slug, stripping diacritics and non-ASCII.
 * Falls back to `winery-{suffix}` if the name has no usable characters.
 */
function slugifyName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'winery';
}

function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`Could not generate unique slug for base="${base}"`);
}

interface Partitioned {
  alreadyLinked: { osm: ParsedWinery; existing: ExistingWinery }[];
  fuzzyMatched: { osm: ParsedWinery; existing: ExistingWinery; reasons: string[] }[];
  newDiscoveries: ParsedWinery[];
}

function partition(parsed: ParsedWinery[], existing: ExistingWinery[]): Partitioned {
  const byOsm = new Map<string, ExistingWinery>();
  for (const e of existing) {
    if (e.osm_type && e.osm_id != null) {
      byOsm.set(`${e.osm_type}/${e.osm_id}`, e);
    }
  }

  const alreadyLinked: Partitioned['alreadyLinked'] = [];
  const fuzzyMatched: Partitioned['fuzzyMatched'] = [];
  const newDiscoveries: Partitioned['newDiscoveries'] = [];

  for (const osm of parsed) {
    const linked = byOsm.get(`${osm.osm_type}/${osm.osm_id}`);
    if (linked) {
      alreadyLinked.push({ osm, existing: linked });
      continue;
    }

    const unlinked = existing.filter((e) => !e.osm_type || e.osm_id == null);
    const candidate: WineryCandidate = {
      name: osm.name,
      latitude: osm.latitude,
      longitude: osm.longitude,
      website_url: osm.website_url ?? undefined,
    };
    const best = findBestMatch(candidate, unlinked);
    if (best) {
      fuzzyMatched.push({
        osm,
        existing: unlinked[best.index],
        reasons: best.result.reasons,
      });
    } else {
      newDiscoveries.push(osm);
    }
  }

  return { alreadyLinked, fuzzyMatched, newDiscoveries };
}

async function run() {
  console.log(`\n=== OSM Winery Discovery${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  const elements = await queryOverpass();
  const parsed = parseElements(elements);
  console.log(`  Parsed ${parsed.length} unique wineries from OSM\n`);

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const existing = await loadExistingWineries(supabase);
  console.log(`  Loaded ${existing.length} existing wineries from DB\n`);

  const { alreadyLinked, fuzzyMatched, newDiscoveries } = partition(parsed, existing);

  console.log(`Partition:`);
  console.log(`  Already linked (osm_type/osm_id match): ${alreadyLinked.length}`);
  console.log(`  Fuzzy-matched to existing editorial row: ${fuzzyMatched.length}`);
  console.log(`  New discoveries:                         ${newDiscoveries.length}\n`);

  if (fuzzyMatched.length > 0) {
    console.log('Fuzzy matches (will stamp osm_type/osm_id onto existing row):');
    for (const m of fuzzyMatched) {
      console.log(`  ${m.osm.name} → ${m.existing.id} (${m.reasons.join(', ')})`);
    }
    console.log();
  }

  if (newDiscoveries.length > 0) {
    console.log('New discoveries:');
    for (const d of newDiscoveries.slice(0, 20)) {
      const domain = extractDomain(d.website_url);
      console.log(
        `  ${d.name} (${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)})${domain ? ` [${domain}]` : ''}`,
      );
    }
    if (newDiscoveries.length > 20) {
      console.log(`  ... and ${newDiscoveries.length - 20} more`);
    }
    console.log();
  }

  if (DRY_RUN) {
    console.log('Dry run — no database writes.');
    return;
  }

  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({ stage: 'discovery', metadata: { source: 'osm', bbox: BBOX } })
    .select('id')
    .single();

  if (runError || !runData) {
    throw new Error(`Failed to start pipeline run: ${runError?.message}`);
  }
  const runId = (runData as { id: number }).id;

  let processed = 0;
  let failed = 0;

  // 1. Already-linked rows: refresh website/phone/address/coords if OSM has newer data.
  for (const { osm, existing: e } of alreadyLinked) {
    const { error } = await supabase
      .from('wineries')
      .update({
        latitude: osm.latitude,
        longitude: osm.longitude,
        website_url: osm.website_url ?? undefined,
        phone: osm.phone ?? undefined,
        address_street: osm.address_street ?? undefined,
        address_city: osm.address_city ?? undefined,
      })
      .eq('id', e.id);
    if (error) {
      console.error(`  Failed to refresh ${e.id}: ${error.message}`);
      failed++;
    } else {
      processed++;
    }
  }

  // 2. Fuzzy matches: stamp osm_type/osm_id onto the existing editorial row.
  for (const { osm, existing: e } of fuzzyMatched) {
    const { error } = await supabase
      .from('wineries')
      .update({
        osm_type: osm.osm_type,
        osm_id: osm.osm_id,
        website_url: e.website_url ?? osm.website_url ?? undefined,
        phone: osm.phone ?? undefined,
      })
      .eq('id', e.id);
    if (error) {
      console.error(`  Failed to link ${e.id} to OSM: ${error.message}`);
      failed++;
    } else {
      processed++;
    }
  }

  // 3. New discoveries: insert minimal wineries rows.
  const takenSlugs = new Set(existing.map((e) => e.slug));
  for (const d of newDiscoveries) {
    const baseSlug = slugifyName(d.name);
    const slug = uniqueSlug(baseSlug, takenSlugs);
    takenSlugs.add(slug);

    const { error } = await supabase.from('wineries').insert({
      id: slug,
      slug,
      name: d.name,
      latitude: d.latitude,
      longitude: d.longitude,
      website_url: d.website_url,
      phone: d.phone,
      address_street: d.address_street,
      address_city: d.address_city,
      osm_type: d.osm_type,
      osm_id: d.osm_id,
      data_source: 'osm_auto',
      content_status: 'draft',
      is_active: true,
    });
    if (error) {
      console.error(`  Failed to insert ${d.name}: ${error.message}`);
      failed++;
    } else {
      processed++;
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
        source: 'osm',
        bbox: BBOX,
        raw_elements: elements.length,
        parsed: parsed.length,
        already_linked: alreadyLinked.length,
        fuzzy_matched: fuzzyMatched.length,
        new_discoveries: newDiscoveries.length,
      },
    })
    .eq('id', runId);

  console.log(`Done. Processed: ${processed}, Failed: ${failed}`);
}

run().catch((err) => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
