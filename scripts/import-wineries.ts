/**
 * Import wineries from CSV files into Supabase.
 *
 * Usage:
 *   pnpm db:import          # real import
 *   pnpm db:import:dry      # parse + validate only, no writes
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, indexById } from './lib/parse-csv.js';

const __dirname =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
import {
  mapAva,
  mapReservationType,
  mapNoiseLevel,
  mapFlightFormat,
  parseBool,
  parseIntOrNull,
  parseFloatOrNull,
  buildHoursJson,
} from './lib/transforms.js';
import { validateWinery, validateFlight, type ValidationError } from './lib/validate.js';

const DRY_RUN = process.argv.includes('--dry-run');

const CSV_DIR = resolve(__dirname, '../docs/csv');
const CSV_FILES = [
  'core-info.csv',
  'experiences.csv',
  'flights-and-pricing.csv',
  'logistics.csv',
  'ratings.csv',
  'style-scores.csv',
  'tasting-and-hours.csv',
  'varietals.csv',
];

function computeSourceHash(): string {
  const hash = createHash('sha256');
  for (const file of CSV_FILES) {
    hash.update(readFileSync(resolve(CSV_DIR, file)));
  }
  return hash.digest('hex');
}

function buildWineryRecord(id: string, sheets: ReturnType<typeof loadSheets>) {
  const core = sheets.coreInfo.get(id);
  const exp = sheets.experiences.get(id);
  const style = sheets.styleScores.get(id);
  const tasting = sheets.tastingHours.get(id);
  const logistics = sheets.logistics.get(id);
  const ratings = sheets.ratings.get(id);
  const varietals = sheets.varietals.get(id);

  if (!core) return null;

  const warnings: string[] = [];
  const ctx = id;

  const avaPrimary = mapAva(core.ava_primary, warnings, ctx);
  const avaSecondary = mapAva(core.ava_secondary, warnings, ctx);

  const { reservationType, isMembersOnly } = tasting
    ? mapReservationType(tasting.reservation_required, warnings, ctx)
    : { reservationType: 'reservations_recommended', isMembersOnly: false };

  const noiseLevel = style ? mapNoiseLevel(style.noise_level, warnings, ctx) : null;

  const record = {
    id,
    slug: id,
    name: core.name,
    description: core.description || null,
    tagline: core.tagline || null,
    website_url: core.website || null,
    phone: core.phone || null,
    address_street: core.address_street || null,
    address_city: core.address_city || null,
    address_zip: core.address_zip || null,
    latitude: parseFloat(core.latitude),
    longitude: parseFloat(core.longitude),
    ava_primary: avaPrimary,
    ava_secondary: avaSecondary,
    nearest_town: core.nearest_town || null,
    production_size: core.production_size || null,
    annual_cases: parseIntOrNull(core.annual_cases || ''),
    winery_scale: core.winery_scale || null,
    tasting_room_vibe: core.tasting_room_vibe || null,
    ownership_type: core.ownership_type || null,

    reservation_type: reservationType,
    reservation_url: tasting?.reservation_url || null,
    walk_in_likelihood: tasting?.walk_in_likelihood || null,
    hours: tasting ? buildHoursJson(tasting) : {},
    tasting_duration_typical: parseIntOrNull(tasting?.tasting_duration_typical || ''),
    last_seating_offset: parseIntOrNull(tasting?.last_seating_offset || ''),
    is_members_only: isMembersOnly,

    style_classic: parseIntOrNull(style?.style_classic || ''),
    style_luxury: parseIntOrNull(style?.style_luxury || ''),
    style_family_friendly: parseIntOrNull(style?.style_family_friendly || ''),
    style_social: parseIntOrNull(style?.style_social || ''),
    style_sustainable: parseIntOrNull(style?.style_sustainable || ''),
    style_adventure: parseIntOrNull(style?.style_adventure || ''),
    vibe: style?.vibe || null,
    noise_level: noiseLevel,
    best_for: style?.best_for || null,
    not_ideal_for: style?.not_ideal_for || null,

    has_cave_tour: parseBool(exp?.has_cave_tour || ''),
    has_vineyard_walk: parseBool(exp?.has_vineyard_walk || ''),
    has_food_pairing: parseBool(exp?.has_food_pairing || ''),
    has_barrel_tasting: parseBool(exp?.has_barrel_tasting || ''),
    has_blending_session: parseBool(exp?.has_blending_session || ''),
    has_picnic_area: parseBool(exp?.has_picnic_area || ''),
    has_restaurant: parseBool(exp?.has_restaurant || ''),
    has_sunset_views: parseBool(exp?.has_sunset_views || ''),
    has_live_music: parseBool(exp?.has_live_music || ''),
    live_music_schedule: exp?.live_music_schedule || null,
    is_dog_friendly: parseBool(exp?.dog_friendly || ''),
    dog_notes: exp?.dog_notes || null,
    is_kid_friendly: parseBool(exp?.kid_friendly || ''),
    kid_activities: exp?.kid_activities || null,
    is_wheelchair_accessible: parseBool(exp?.wheelchair_accessible || ''),
    accessibility_notes: exp?.accessibility_notes || null,

    max_group_size: parseIntOrNull(logistics?.max_group_size || ''),
    large_group_friendly: parseBool(logistics?.large_group_friendly || ''),
    private_tasting_available: parseBool(logistics?.private_tasting_available || ''),
    is_bike_friendly: parseBool(logistics?.bike_friendly || ''),
    has_bike_parking: parseBool(logistics?.bike_parking || ''),
    is_rideshare_friendly: parseBool(logistics?.rideshare_friendly || ''),
    walkable_from: logistics?.walkable_from || null,
    parking_type: logistics?.parking_type || null,
    parking_notes: logistics?.parking_notes || null,
    nearby_wineries: logistics?.nearby_wineries || null,
    pairs_well_with: logistics?.pairs_well_with || null,

    rating_google: parseFloatOrNull(ratings?.rating_google || ''),
    rating_yelp: parseFloatOrNull(ratings?.rating_yelp || ''),
    rating_tripadvisor: parseFloatOrNull(ratings?.rating_tripadvisor || ''),
    review_count_total: parseIntOrNull(ratings?.review_count_total || ''),
    quality_score: parseIntOrNull(ratings?.quality_score || ''),
    popularity_score: parseIntOrNull(ratings?.popularity_score || ''),
    is_hidden_gem: parseBool(ratings?.hidden_gem || ''),
    is_must_visit: parseBool(ratings?.must_visit || ''),
    is_local_favorite: parseBool(ratings?.local_favorite || ''),
    unique_selling_point: ratings?.unique_selling_point || null,
    awards: ratings?.awards || null,
    good_for_mix_intimate: parseBool(ratings?.good_for_mix_intimate || ''),
    good_for_mix_grand: parseBool(ratings?.good_for_mix_grand || ''),

    signature_wines: varietals?.signature_wines || null,
    is_active: true,
    data_source: 'editorial_excel',
  };

  return { record, warnings };
}

function buildVarietalRecords(id: string, sheets: ReturnType<typeof loadSheets>) {
  const row = sheets.varietals.get(id);
  if (!row) return [];

  const varietalColumns = [
    'pinot_noir',
    'chardonnay',
    'cabernet_sauvignon',
    'zinfandel',
    'sauvignon_blanc',
    'merlot',
    'sparkling',
    'rose',
    'syrah',
  ];

  const signatureWines = (row.signature_wines || '').toLowerCase();
  const records: { winery_id: string; varietal: string; is_signature: boolean }[] = [];

  for (const col of varietalColumns) {
    if (parseBool(row[col] || '')) {
      const displayName = col.replace(/_/g, ' ');
      const isSignature = signatureWines.includes(displayName);
      records.push({ winery_id: id, varietal: col, is_signature: isSignature });
    }
  }

  if (row.other_varietals) {
    const others = row.other_varietals
      .split(',')
      .map((v: string) => v.trim().toLowerCase().replace(/\s+/g, '_'));
    for (const v of others) {
      if (v) records.push({ winery_id: id, varietal: v, is_signature: false });
    }
  }

  return records;
}

function buildFlightRecords(
  id: string,
  flightRows: ReturnType<typeof parseCSV>,
  allWarnings: string[],
) {
  const wineryFlights = flightRows.filter((r) => r.id === id);
  const records: Record<string, unknown>[] = [];

  for (const row of wineryFlights) {
    const format = mapFlightFormat(row.flight_type, allWarnings, `${id}/${row.flight_name}`);
    const record = {
      winery_id: id,
      name: row.flight_name,
      price: parseFloatOrNull(row.flight_price),
      wines_count: parseIntOrNull(row.flight_wines_count),
      duration_minutes: parseIntOrNull(row.flight_duration),
      format,
      food_included: parseBool(row.flight_food_included || ''),
      reservation_required: parseBool(row.flight_reservation_required || ''),
      description: row.flight_description || null,
    };

    const flightErrors = validateFlight(record, id, row.flight_name);
    if (flightErrors.length > 0) {
      for (const e of flightErrors) allWarnings.push(`${e.wineryId}: ${e.message}`);
    }

    records.push(record);
  }

  return records;
}

function loadSheets() {
  return {
    coreInfo: indexById(parseCSV('core-info.csv')),
    experiences: indexById(parseCSV('experiences.csv')),
    styleScores: indexById(parseCSV('style-scores.csv')),
    tastingHours: indexById(parseCSV('tasting-and-hours.csv')),
    logistics: indexById(parseCSV('logistics.csv')),
    ratings: indexById(parseCSV('ratings.csv')),
    varietals: indexById(parseCSV('varietals.csv')),
    flights: parseCSV('flights-and-pricing.csv'),
  };
}

async function main() {
  console.log(
    DRY_RUN ? '🏜️  DRY RUN — no database writes\n' : '🍷 Importing wineries to Supabase\n',
  );

  const sheets = loadSheets();
  const wineryIds = [...sheets.coreInfo.keys()];
  const sourceHash = computeSourceHash();

  console.log(`Source files hash: ${sourceHash.slice(0, 12)}...`);
  console.log(`Found ${wineryIds.length} wineries in core-info.csv`);
  console.log(`Found ${sheets.flights.length} flights in flights-and-pricing.csv\n`);

  const allWineries: Record<string, unknown>[] = [];
  const allVarietals: { winery_id: string; varietal: string; is_signature: boolean }[] = [];
  const allFlights: Record<string, unknown>[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: string[] = [];
  const duplicateSlugs = new Set<string>();

  const seenSlugs = new Set<string>();
  for (const id of wineryIds) {
    if (seenSlugs.has(id)) {
      duplicateSlugs.add(id);
      continue;
    }
    seenSlugs.add(id);

    const result = buildWineryRecord(id, sheets);
    if (!result) continue;

    const { record, warnings } = result;
    allWarnings.push(...warnings);

    const { errors, warnings: valWarnings } = validateWinery(record, id);
    allErrors.push(...errors);
    allWarnings.push(...valWarnings.map((w) => `${w.wineryId}: ${w.message}`));

    if (errors.length === 0) {
      allWineries.push(record);
    }

    allVarietals.push(...buildVarietalRecords(id, sheets));
    allFlights.push(...buildFlightRecords(id, sheets.flights, allWarnings));
  }

  if (duplicateSlugs.size > 0) {
    console.log(`⚠️  Duplicate slugs (skipped): ${[...duplicateSlugs].join(', ')}`);
  }

  console.log('--- Validation Summary ---');
  console.log(`Wineries valid: ${allWineries.length}`);
  console.log(`Wineries with fatal errors: ${allErrors.length > 0 ? allErrors.length : 0}`);
  console.log(`Varietals: ${allVarietals.length}`);
  console.log(`Flights: ${allFlights.length}`);
  console.log(`Warnings: ${allWarnings.length}`);

  if (allErrors.length > 0) {
    console.log('\n❌ Errors:');
    for (const e of allErrors) {
      console.log(`  ${e.wineryId} — ${e.field}: ${e.message}`);
    }
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const w of allWarnings) {
      console.log(`  ${w}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. No data was written.');

    const regions = new Set(allWineries.map((w) => w.ava_primary as string));
    console.log(`\nAVA regions represented: ${[...regions].sort().join(', ')}`);

    const priceFlights = allFlights.filter(
      (f) => (f.price as number) != null && (f.price as number) <= 200,
    );
    console.log(`Flights ≤$200 (for min price calc): ${priceFlights.length}`);
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      '\n❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.',
    );
    console.error('   Set them in .env.local or pass via environment.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: importRun, error: runError } = await supabase
    .from('import_runs')
    .insert({
      source_file_hash: sourceHash,
      started_at: new Date().toISOString(),
      wineries_upserted: 0,
      flights_upserted: 0,
      varietals_upserted: 0,
      errors: [],
      warnings: allWarnings.map((w) => ({ message: w })),
    })
    .select('id')
    .single();

  if (runError) {
    console.error('Failed to create import run:', runError.message);
    process.exit(1);
  }

  console.log(`\nImport run #${importRun.id} started`);

  console.log('\nUpserting wineries...');
  const { error: wineryError } = await supabase
    .from('wineries')
    .upsert(allWineries, { onConflict: 'slug' });

  if (wineryError) {
    console.error('❌ Winery upsert failed:', wineryError.message);
    await supabase
      .from('import_runs')
      .update({
        finished_at: new Date().toISOString(),
        errors: [{ message: wineryError.message }],
      })
      .eq('id', importRun.id);
    process.exit(1);
  }
  console.log(`  ✅ ${allWineries.length} wineries upserted`);

  console.log('Replacing varietals...');
  const wineryIdsToUpdate = [...new Set(allVarietals.map((v) => v.winery_id))];
  for (const wid of wineryIdsToUpdate) {
    await supabase.from('winery_varietals').delete().eq('winery_id', wid);
  }
  if (allVarietals.length > 0) {
    const { error: varError } = await supabase.from('winery_varietals').insert(allVarietals);
    if (varError) {
      console.error('❌ Varietal insert failed:', varError.message);
    } else {
      console.log(`  ✅ ${allVarietals.length} varietals inserted`);
    }
  }

  console.log('Replacing flights...');
  const flightWineryIds = [...new Set(allFlights.map((f) => f.winery_id as string))];
  for (const wid of flightWineryIds) {
    await supabase.from('flights').delete().eq('winery_id', wid);
  }
  if (allFlights.length > 0) {
    const { error: flightError } = await supabase.from('flights').insert(allFlights);
    if (flightError) {
      console.error('❌ Flight insert failed:', flightError.message);
    } else {
      console.log(`  ✅ ${allFlights.length} flights inserted`);
    }
  }

  await supabase
    .from('import_runs')
    .update({
      finished_at: new Date().toISOString(),
      wineries_upserted: allWineries.length,
      flights_upserted: allFlights.length,
      varietals_upserted: allVarietals.length,
      warnings: allWarnings.map((w) => ({ message: w })),
    })
    .eq('id', importRun.id);

  console.log('\n--- Post-Import Verification ---');
  const { count: wineryCount } = await supabase
    .from('wineries')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  const { count: flightCount } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true });
  const { count: varietalCount } = await supabase
    .from('winery_varietals')
    .select('*', { count: 'exact', head: true });

  console.log(`Active wineries: ${wineryCount} (expected 65-68)`);
  console.log(`Flights: ${flightCount} (expected ≥100)`);
  console.log(`Varietals: ${varietalCount}`);

  if (wineryCount != null && (wineryCount < 60 || wineryCount > 75)) {
    console.log('⚠️  Winery count outside expected range!');
  }
  if (flightCount != null && flightCount < 100) {
    console.log('⚠️  Flight count lower than expected!');
  }

  const { data: orphanFlights } = await supabase
    .from('flights')
    .select('winery_id')
    .not('winery_id', 'in', `(${allWineries.map((w) => `"${w.id}"`).join(',')})`);
  if (orphanFlights && orphanFlights.length > 0) {
    console.log(`⚠️  Orphan flights found: ${orphanFlights.length}`);
  } else {
    console.log('✅ No orphan flights');
  }

  console.log(`\n✅ Import complete! Run #${importRun.id}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
