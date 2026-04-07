/**
 * Discover wineries from OpenStreetMap via the Overpass API.
 *
 * Queries for amenity=winery and craft=winery within the Sonoma County
 * bounding box, deduplicates against existing wineries in the database,
 * and inserts new discoveries into winery_registry.
 *
 * Usage:
 *   pnpm discover:osm            # run discovery
 *   pnpm discover:osm --dry-run  # query + dedup only, no DB writes
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  normalizeName,
  extractDomain,
  findBestMatch,
  type WineryCandidate,
} from '../src/lib/pipeline/dedup.js';

const DRY_RUN = process.argv.includes('--dry-run');

// Sonoma County bounding box (generous to catch edges)
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
  address: string | null;
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

    // Deduplicate OSM results (same name + close coordinates)
    const key = `${normalizeName(name)}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const website =
      el.tags?.website || el.tags?.['contact:website'] || el.tags?.url || null;

    results.push({
      osm_type: el.type,
      osm_id: el.id,
      name,
      normalized_name: normalizeName(name),
      latitude: lat,
      longitude: lon,
      website_url: website,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
        .filter(Boolean)
        .join(' ') || null,
    });
  }

  return results;
}

async function loadExistingWineries(): Promise<
  (WineryCandidate & { id: string })[]
> {
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

async function run() {
  console.log(`\n=== OSM Winery Discovery${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  const elements = await queryOverpass();
  const parsed = parseElements(elements);
  console.log(`  Parsed ${parsed.length} unique wineries from OSM\n`);

  const existing = await loadExistingWineries();
  console.log(`  Loaded ${existing.length} existing wineries from DB\n`);

  const matched: { osm: ParsedWinery; existingId: string; reasons: string[] }[] = [];
  const newDiscoveries: ParsedWinery[] = [];

  for (const osm of parsed) {
    const candidate: WineryCandidate = {
      name: osm.name,
      latitude: osm.latitude,
      longitude: osm.longitude,
      website_url: osm.website_url ?? undefined,
    };

    const best = findBestMatch(candidate, existing);
    if (best) {
      matched.push({
        osm,
        existingId: existing[best.index].id,
        reasons: best.result.reasons,
      });
    } else {
      newDiscoveries.push(osm);
    }
  }

  console.log(`Results:`);
  console.log(`  Matched to existing: ${matched.length}`);
  console.log(`  New discoveries:     ${newDiscoveries.length}\n`);

  if (matched.length > 0) {
    console.log('Matches:');
    for (const m of matched) {
      console.log(`  ${m.osm.name} → ${m.existingId} (${m.reasons.join(', ')})`);
    }
    console.log();
  }

  if (newDiscoveries.length > 0) {
    console.log('New discoveries:');
    for (const d of newDiscoveries) {
      const domain = extractDomain(d.website_url);
      console.log(`  ${d.name} (${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)})${domain ? ` [${domain}]` : ''}`);
    }
    console.log();
  }

  if (DRY_RUN) {
    console.log('Dry run — no database writes.');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Start a pipeline run
  const { data: runData, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({ stage: 'discovery', metadata: { source: 'osm', bbox: BBOX } })
    .select('id')
    .single();

  if (runError || !runData) {
    throw new Error(`Failed to start pipeline run: ${runError?.message}`);
  }
  const runId = runData.id;

  // Upsert matched wineries into registry
  let processed = 0;
  let failed = 0;

  for (const m of matched) {
    const { error } = await supabase.from('winery_registry').upsert(
      {
        name: m.osm.name,
        normalized_name: m.osm.normalized_name,
        source: 'osm',
        source_id: `${m.osm.osm_type}/${m.osm.osm_id}`,
        website_url: m.osm.website_url,
        latitude: m.osm.latitude,
        longitude: m.osm.longitude,
        matched_winery_id: m.existingId,
        coverage_tier: 'editorial',
      },
      { onConflict: 'source,source_id', ignoreDuplicates: false },
    );
    if (error) {
      console.error(`  Failed to upsert ${m.osm.name}: ${error.message}`);
      failed++;
    } else {
      processed++;
    }
  }

  // Insert new discoveries
  for (const d of newDiscoveries) {
    const { error } = await supabase.from('winery_registry').upsert(
      {
        name: d.name,
        normalized_name: d.normalized_name,
        source: 'osm',
        source_id: `${d.osm_type}/${d.osm_id}`,
        website_url: d.website_url,
        latitude: d.latitude,
        longitude: d.longitude,
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

  // Complete the pipeline run
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
        matched: matched.length,
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
