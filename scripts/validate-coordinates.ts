#!/usr/bin/env npx tsx
/**
 * D2.3 — Validate winery coordinates against Sonoma County bounds,
 * check for duplicates, and flag outliers.
 *
 * Usage:
 *   npx tsx scripts/validate-coordinates.ts
 *   npx tsx scripts/validate-coordinates.ts --json
 */

import { parseCSV } from './lib/parse-csv';

const SONOMA_BOUNDS = {
  latMin: 38.0,
  latMax: 39.0,
  lonMin: -123.5,
  lonMax: -122.0,
};

const SONOMA_CITIES = new Set([
  'healdsburg',
  'sonoma',
  'santa rosa',
  'sebastopol',
  'windsor',
  'glen ellen',
  'kenwood',
  'geyserville',
  'guerneville',
  'forestville',
  'petaluma',
  'jenner',
  'fulton',
  'cloverdale',
  'cotati',
  'rohnert park',
  'bodega bay',
  'occidental',
]);

// Napa is NOT Sonoma County — flag wineries listed in Napa
const NAPA_CITIES = new Set([
  'napa',
  'st. helena',
  'yountville',
  'calistoga',
  'rutherford',
  'oakville',
]);

interface WineryCoord {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  zip: string;
  ava: string;
}

interface ValidationIssue {
  wineryId: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: string;
  message: string;
  stored?: { lat: number; lng: number };
  distanceKm?: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadWineries(): WineryCoord[] {
  const rows = parseCSV('core-info.csv');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    lat: parseFloat(row.latitude),
    lng: parseFloat(row.longitude),
    address: row.address_street,
    city: row.address_city,
    zip: row.address_zip,
    ava: row.ava_primary,
  }));
}

// AVA regions and their approximate center coordinates for cross-checking
const AVA_CENTERS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  'alexander-valley': { lat: 38.68, lng: -122.85, radiusKm: 15 },
  'dry-creek-valley': { lat: 38.69, lng: -122.93, radiusKm: 10 },
  'russian-river-valley': { lat: 38.5, lng: -122.88, radiusKm: 18 },
  'sonoma-valley': { lat: 38.35, lng: -122.52, radiusKm: 15 },
  carneros: { lat: 38.25, lng: -122.4, radiusKm: 12 },
  'sonoma-coast': { lat: 38.45, lng: -123.05, radiusKm: 30 },
  'green-valley': { lat: 38.43, lng: -122.9, radiusKm: 8 },
  'petaluma-gap': { lat: 38.22, lng: -122.6, radiusKm: 12 },
  'sonoma-mountain': { lat: 38.35, lng: -122.55, radiusKm: 10 },
  rockpile: { lat: 38.75, lng: -122.95, radiusKm: 8 },
  'chalk-hill': { lat: 38.62, lng: -122.77, radiusKm: 8 },
  'fort-ross-seaview': { lat: 38.52, lng: -123.2, radiusKm: 15 },
  'bennett-valley': { lat: 38.42, lng: -122.68, radiusKm: 8 },
};

function main() {
  const jsonMode = process.argv.includes('--json');
  const wineries = loadWineries();
  const issues: ValidationIssue[] = [];

  if (!jsonMode) {
    console.log(`\n🔍 Validating coordinates for ${wineries.length} wineries\n`);
    console.log('─'.repeat(70));
  }

  // === CHECK 1: Bounding box ===
  if (!jsonMode) console.log('\n📐 Check 1: Sonoma County bounding box\n');

  let boundsPass = 0;
  for (const w of wineries) {
    if (isNaN(w.lat) || isNaN(w.lng)) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'error',
        check: 'bounds',
        message: 'Missing or invalid coordinates',
      });
      continue;
    }

    const inBounds =
      w.lat >= SONOMA_BOUNDS.latMin &&
      w.lat <= SONOMA_BOUNDS.latMax &&
      w.lng >= SONOMA_BOUNDS.lonMin &&
      w.lng <= SONOMA_BOUNDS.lonMax;

    if (!inBounds) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'error',
        check: 'bounds',
        message: `Outside Sonoma bounds: (${w.lat}, ${w.lng})`,
        stored: { lat: w.lat, lng: w.lng },
      });
    } else {
      boundsPass++;
    }
  }

  if (!jsonMode) {
    console.log(`  ✅ ${boundsPass}/${wineries.length} within Sonoma County bounding box`);
    for (const i of issues.filter((i) => i.check === 'bounds')) {
      console.log(`  ❌ ${i.wineryId}: ${i.message}`);
    }
  }

  // === CHECK 2: City validation ===
  if (!jsonMode) console.log('\n🏘️  Check 2: City belongs to Sonoma County\n');

  let cityPass = 0;
  for (const w of wineries) {
    const cityLower = w.city.toLowerCase();
    if (NAPA_CITIES.has(cityLower)) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'warning',
        check: 'city-napa',
        message: `City "${w.city}" is in Napa County, not Sonoma — verify this is a Carneros/border winery`,
        stored: { lat: w.lat, lng: w.lng },
      });
    } else if (!SONOMA_CITIES.has(cityLower)) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'info',
        check: 'city-unknown',
        message: `City "${w.city}" not in known Sonoma cities list — may be valid, verify`,
        stored: { lat: w.lat, lng: w.lng },
      });
    } else {
      cityPass++;
    }
  }

  if (!jsonMode) {
    console.log(`  ✅ ${cityPass}/${wineries.length} in recognized Sonoma County cities`);
    for (const i of issues.filter((i) => i.check === 'city-napa')) {
      console.log(`  ⚠️  ${i.wineryId}: ${i.message}`);
    }
    for (const i of issues.filter((i) => i.check === 'city-unknown')) {
      console.log(`  ℹ️  ${i.wineryId}: ${i.message}`);
    }
  }

  // === CHECK 3: Duplicate coordinates ===
  if (!jsonMode) console.log('\n🔄 Check 3: Duplicate coordinates\n');

  const coordMap = new Map<string, WineryCoord[]>();
  for (const w of wineries) {
    const key = `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`;
    const group = coordMap.get(key) || [];
    group.push(w);
    coordMap.set(key, group);
  }

  let dupeCount = 0;
  const dupeGroups: string[][] = [];
  for (const [, group] of coordMap) {
    if (group.length > 1) {
      dupeGroups.push(group.map((w) => w.id));
      for (const w of group) {
        dupeCount++;
        issues.push({
          wineryId: w.id,
          name: w.name,
          severity: 'warning',
          check: 'duplicate-coords',
          message: `Shares coordinates with: ${group
            .filter((g) => g.id !== w.id)
            .map((g) => g.id)
            .join(', ')}`,
          stored: { lat: w.lat, lng: w.lng },
        });
      }
    }
  }

  if (!jsonMode) {
    if (dupeGroups.length === 0) {
      console.log('  ✅ No duplicate coordinates found');
    } else {
      console.log(
        `  ⚠️  ${dupeGroups.length} groups of duplicate coordinates (${dupeCount} wineries):`,
      );
      for (const group of dupeGroups) {
        const w = wineries.find((w) => w.id === group[0])!;
        console.log(`    (${w.lat}, ${w.lng}): ${group.join(', ')}`);
      }
    }
  }

  // === CHECK 4: AVA region plausibility ===
  if (!jsonMode) console.log('\n🗺️  Check 4: AVA region vs coordinate plausibility\n');

  let avaPass = 0;
  let avaWarn = 0;
  for (const w of wineries) {
    if (isNaN(w.lat) || isNaN(w.lng)) continue;
    const center = AVA_CENTERS[w.ava];
    if (!center) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'info',
        check: 'ava-unknown',
        message: `AVA "${w.ava}" not in known center list`,
        stored: { lat: w.lat, lng: w.lng },
      });
      continue;
    }

    const dist = haversineKm(w.lat, w.lng, center.lat, center.lng);
    if (dist > center.radiusKm * 1.5) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'warning',
        check: 'ava-distance',
        message: `${dist.toFixed(1)}km from ${w.ava} center (expected <${(center.radiusKm * 1.5).toFixed(0)}km). May be mislabeled or edge case.`,
        stored: { lat: w.lat, lng: w.lng },
        distanceKm: dist,
      });
      avaWarn++;
    } else {
      avaPass++;
    }
  }

  if (!jsonMode) {
    console.log(`  ✅ ${avaPass}/${wineries.length} plausible for their AVA region`);
    for (const i of issues.filter((i) => i.check === 'ava-distance')) {
      console.log(`  ⚠️  ${i.wineryId} (${i.name}): ${i.message}`);
    }
    for (const i of issues.filter((i) => i.check === 'ava-unknown')) {
      console.log(`  ℹ️  ${i.wineryId}: ${i.message}`);
    }
  }

  // === CHECK 5: Nearest-neighbor outliers ===
  if (!jsonMode) console.log('\n📏 Check 5: Geographic outliers (distance to nearest neighbor)\n');

  const distances: { id: string; name: string; nearestId: string; distKm: number }[] = [];
  for (const w of wineries) {
    if (isNaN(w.lat) || isNaN(w.lng)) continue;
    let minDist = Infinity;
    let nearestId = '';
    for (const other of wineries) {
      if (other.id === w.id || isNaN(other.lat) || isNaN(other.lng)) continue;
      const d = haversineKm(w.lat, w.lng, other.lat, other.lng);
      if (d < minDist) {
        minDist = d;
        nearestId = other.id;
      }
    }
    distances.push({ id: w.id, name: w.name, nearestId, distKm: minDist });
  }

  distances.sort((a, b) => b.distKm - a.distKm);
  const median = distances[Math.floor(distances.length / 2)].distKm;
  const outlierThreshold = median * 4;

  if (!jsonMode) {
    console.log(`  Median nearest-neighbor distance: ${median.toFixed(2)}km`);
    console.log(`  Outlier threshold (4x median):    ${outlierThreshold.toFixed(2)}km`);
    console.log(`\n  Most isolated wineries (top 10):`);
    for (const d of distances.slice(0, 10)) {
      const flag = d.distKm > outlierThreshold ? ' ⚠️  OUTLIER' : '';
      console.log(`    ${d.id}: ${d.distKm.toFixed(2)}km to ${d.nearestId}${flag}`);
    }
  }

  for (const d of distances) {
    if (d.distKm > outlierThreshold) {
      issues.push({
        wineryId: d.id,
        name: d.name,
        severity: 'info',
        check: 'geographic-outlier',
        message: `Most isolated: ${d.distKm.toFixed(1)}km to nearest neighbor (${d.nearestId}). Threshold: ${outlierThreshold.toFixed(1)}km`,
        distanceKm: d.distKm,
      });
    }
  }

  // === CHECK 6: ZIP code plausibility ===
  if (!jsonMode) console.log('\n📮 Check 6: ZIP code cross-check\n');

  // Sonoma County ZIP codes
  const SONOMA_ZIPS = new Set([
    '95401',
    '95402',
    '95403',
    '95404',
    '95405',
    '95406',
    '95407',
    '95409',
    '95412',
    '95416',
    '95419',
    '95421',
    '95425',
    '95430',
    '95431',
    '95433',
    '95436',
    '95439',
    '95441',
    '95442',
    '95444',
    '95446',
    '95448',
    '95450',
    '95452',
    '95462',
    '95465',
    '95471',
    '95472',
    '95473',
    '95476',
    '95486',
    '95492',
    '95497',
  ]);
  // Napa-side Carneros zips that may appear
  const NAPA_BORDER_ZIPS = new Set(['94559', '94558', '94574', '94515']);
  // Petaluma zips (sometimes mailing addresses)
  const PETALUMA_ZIPS = new Set(['94952', '94953', '94954']);

  let zipPass = 0;
  for (const w of wineries) {
    const zip = w.zip;
    if (SONOMA_ZIPS.has(zip) || PETALUMA_ZIPS.has(zip)) {
      zipPass++;
    } else if (NAPA_BORDER_ZIPS.has(zip)) {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'info',
        check: 'zip-napa-border',
        message: `ZIP ${zip} is Napa-side — expected for Carneros border wineries`,
      });
    } else {
      issues.push({
        wineryId: w.id,
        name: w.name,
        severity: 'warning',
        check: 'zip-unknown',
        message: `ZIP ${zip} not in Sonoma County ZIP list`,
      });
    }
  }

  if (!jsonMode) {
    console.log(`  ✅ ${zipPass}/${wineries.length} have Sonoma County ZIP codes`);
    for (const i of issues.filter((i) => i.check === 'zip-napa-border')) {
      console.log(`  ℹ️  ${i.wineryId}: ${i.message}`);
    }
    for (const i of issues.filter((i) => i.check === 'zip-unknown')) {
      console.log(`  ⚠️  ${i.wineryId}: ${i.message}`);
    }
  }

  // === FINAL REPORT ===
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  if (jsonMode) {
    console.log(JSON.stringify({ total: wineries.length, issues }, null, 2));
  } else {
    console.log('\n' + '═'.repeat(70));
    console.log('FINAL REPORT');
    console.log('═'.repeat(70));
    console.log(`Wineries checked: ${wineries.length}`);
    console.log(`Errors:   ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Info:     ${infos.length}`);

    if (errors.length > 0) {
      console.log('\n🚨 ERRORS (must fix):');
      for (const e of errors) console.log(`  ${e.wineryId}: [${e.check}] ${e.message}`);
    }
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (should investigate):');
      for (const w of warnings) console.log(`  ${w.wineryId}: [${w.check}] ${w.message}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('Next step: spot-check 10 wineries on a real map to verify coordinates.');
    console.log('═'.repeat(70) + '\n');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
