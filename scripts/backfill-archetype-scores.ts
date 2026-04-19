/**
 * One-shot backfill for the Quiz v1.0 archetype redesign.
 *
 * Populates five new/renamed fields on the 68 editorial (published) wineries
 * using heuristics derived from existing editorial columns:
 *   - archetype_scores (jsonb, 0-10 per archetype)
 *   - house_specialty  (text[], 1-3 signature varietals)
 *   - kid_welcome      (boolean, default true unless 21+ policy detected)
 *   - winery_scale     (boutique | family_estate | destination, by annual_cases)
 *
 * group_capacity is left alone — the rename preserved existing values.
 *
 * Deletable after one successful run. Re-running is idempotent for published
 * rows but will overwrite any admin-UI edits, so don't re-run once admins
 * start curating.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-archetype-scores.ts --dry-run
 *   pnpm tsx scripts/backfill-archetype-scores.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/lib/database.types.js';

type WineryRow = Database['public']['Tables']['wineries']['Row'];
type VarietalRow = Database['public']['Tables']['winery_varietals']['Row'];

const DRY_RUN = process.argv.includes('--dry-run');

type Archetype = 'explorer' | 'collector' | 'student' | 'socializer' | 'romantic';
type ArchetypeScores = Record<Archetype, number>;
type WineryScale = 'boutique' | 'family_estate' | 'destination';

interface BackfillUpdate {
  slug: string;
  archetype_scores: ArchetypeScores;
  house_specialty: string[];
  kid_welcome: boolean;
  winery_scale: WineryScale | null;
}

const SCALE_OVERRIDES: Record<string, WineryScale> = {
  'ridge-lytton-springs': 'family_estate',
};

const KID_UNWELCOME_KEYWORDS = ['21+', '21 and over', 'adults only', 'adult-only', 'no children'];

function clamp(n: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

function scoreExplorer(row: WineryRow): number {
  let score = 3;
  if (row.is_hidden_gem) score += 5;
  if ((row.style_adventure ?? 0) >= 4) score += 3;
  if (row.setting === 'cave' || row.setting === 'hilltop') score += 2;
  if (!row.is_must_visit) score += 2;
  return clamp(score);
}

function scoreCollector(row: WineryRow): number {
  let score = 3;
  if (row.is_members_only) score += 4;
  if ((row.style_luxury ?? 0) >= 4) score += 3;
  if ((row.style_classic ?? 0) >= 4) score += 2;
  if ((row.quality_score ?? 0) >= 8) score += 2;
  return clamp(score);
}

function scoreStudent(row: WineryRow): number {
  let score = 3;
  if ((row.style_sustainable ?? 0) >= 4) score += 3;
  if (row.has_barrel_tasting) score += 1;
  if (row.has_cave_tour) score += 1;
  if (row.has_blending_session) score += 1;
  if (row.has_vineyard_walk) score += 1;
  if (row.reservation_type === 'appointment_only') score += 2;
  return clamp(score);
}

function scoreSocializer(row: WineryRow): number {
  let score = 3;
  if ((row.style_social ?? 0) >= 4) score += 4;
  if (row.has_live_music) score += 2;
  if (row.large_group_friendly) score += 2;
  if ((row.group_capacity ?? 0) >= 8) score += 1;
  return clamp(score);
}

function scoreRomantic(row: WineryRow): number {
  let score = 3;
  if (row.has_sunset_views) score += 3;
  if (row.setting === 'vineyard' || row.setting === 'hilltop' || row.setting === 'cave') score += 2;
  if (row.good_for_mix_intimate) score += 2;
  if (row.noise_level === 'quiet') score += 2;
  return clamp(score);
}

function deriveArchetypeScores(row: WineryRow): ArchetypeScores {
  return {
    explorer: scoreExplorer(row),
    collector: scoreCollector(row),
    student: scoreStudent(row),
    socializer: scoreSocializer(row),
    romantic: scoreRomantic(row),
  };
}

function deriveHouseSpecialty(varietals: VarietalRow[]): string[] {
  const signature = varietals.filter((v) => v.is_signature).map((v) => v.varietal);
  if (signature.length > 0) return signature.slice(0, 3);
  return varietals.slice(0, 3).map((v) => v.varietal);
}

function deriveKidWelcome(row: WineryRow): boolean {
  const vibe = (row.tasting_room_vibe ?? '').toLowerCase();
  const notes = (row.accessibility_notes ?? '').toLowerCase();
  const haystack = `${vibe} ${notes}`;
  return !KID_UNWELCOME_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function deriveWineryScale(row: WineryRow): WineryScale | null {
  const override = SCALE_OVERRIDES[row.slug];
  if (override) return override;
  const cases = row.annual_cases;
  if (cases == null) return null;
  if (cases < 5000) return 'boutique';
  if (cases <= 50000) return 'family_estate';
  return 'destination';
}

async function fetchPublishedWineries(supabase: ReturnType<typeof createClient<Database>>) {
  const { data, error } = await supabase
    .from('wineries')
    .select('*, winery_varietals(*)')
    .eq('content_status', 'published');
  if (error) throw new Error(`Fetch failed: ${error.message}`);
  if (!data) throw new Error('No wineries returned.');
  return data;
}

function buildUpdate(
  row: WineryRow & { winery_varietals: VarietalRow[] },
): BackfillUpdate {
  return {
    slug: row.slug,
    archetype_scores: deriveArchetypeScores(row),
    house_specialty: deriveHouseSpecialty(row.winery_varietals),
    kid_welcome: deriveKidWelcome(row),
    winery_scale: deriveWineryScale(row),
  };
}

function summarize(updates: BackfillUpdate[]) {
  const scaleCounts = updates.reduce<Record<string, number>>((acc, u) => {
    const key = u.winery_scale ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const specialtyCoverage = updates.filter((u) => u.house_specialty.length > 0).length;
  const kidWelcomeCount = updates.filter((u) => u.kid_welcome).length;

  console.log(`\nCovered ${updates.length} published wineries.`);
  console.log(`  house_specialty populated: ${specialtyCoverage}/${updates.length}`);
  console.log(`  kid_welcome=true: ${kidWelcomeCount}/${updates.length}`);
  console.log('  winery_scale:');
  for (const [scale, count] of Object.entries(scaleCounts).sort()) {
    console.log(`    ${scale}: ${count}`);
  }
}

async function run() {
  console.log(`\n=== Backfill archetype scores${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const rows = await fetchPublishedWineries(supabase);
  const updates = rows.map(buildUpdate);

  summarize(updates);

  if (DRY_RUN) {
    console.log('\nSample updates:');
    for (const u of updates.slice(0, 3)) {
      console.log(`  ${u.slug}:`, JSON.stringify(u, null, 2));
    }
    console.log('\nDry run — no database writes.');
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from('wineries')
      .update({
        archetype_scores: u.archetype_scores,
        house_specialty: u.house_specialty,
        kid_welcome: u.kid_welcome,
        winery_scale: u.winery_scale,
      })
      .eq('slug', u.slug);
    if (error) {
      console.error(`  ${u.slug}: ${error.message}`);
      failed += 1;
    } else {
      ok += 1;
    }
  }

  console.log(`\nUpdated ${ok}/${updates.length} wineries. ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
