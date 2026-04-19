import type { MatchResult, QuizAnswers, Winery, WineryForMatching } from '../types';
import { applyFiltersWithRelaxation } from './filters';
import { generateReasons } from './explain';
import { scoreWinery } from './score';

type ScoredEntry = {
  winery: WineryForMatching;
  score: number;
  reasons: string[];
};

function tieBreakCompare(a: ScoredEntry, b: ScoredEntry): number {
  if (a.score !== b.score) return b.score - a.score;

  const aq = a.winery.qualityScore ?? 0;
  const bq = b.winery.qualityScore ?? 0;
  if (aq !== bq) return bq - aq;

  const ar = a.winery.ratingGoogle ?? 0;
  const br = b.winery.ratingGoogle ?? 0;
  if (ar !== br) return br - ar;

  return a.winery.slug.localeCompare(b.winery.slug);
}

function applyDiversity(sorted: ScoredEntry[], topN: number): ScoredEntry[] {
  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);

  const regionCounts = new Map<string, number>();
  for (const entry of top) {
    regionCounts.set(entry.winery.region, (regionCounts.get(entry.winery.region) ?? 0) + 1);
  }

  const uniqueRegionsInFull = new Set(sorted.map((e) => e.winery.region));
  if (uniqueRegionsInFull.size < 3) return sorted;

  for (const [region, count] of regionCounts) {
    if (count < 3) continue;

    const overrepresented = top
      .map((entry, i) => ({ entry, i }))
      .filter(({ entry }) => entry.winery.region === region);

    const demoteIdx = overrepresented[overrepresented.length - 1].i;

    const replacement = rest.find((e) => e.winery.region !== region);
    if (!replacement) continue;

    const demoted = top.splice(demoteIdx, 1)[0];
    rest.splice(rest.indexOf(replacement), 1);
    top.push(replacement);
    rest.unshift(demoted);
    break;
  }

  return [...top, ...rest];
}

export type RecommendOptions = {
  topN?: number;
};

export function recommend(
  wineries: WineryForMatching[],
  answers: QuizAnswers,
  wineryLookup: Map<string, Winery>,
  options: RecommendOptions = {},
): MatchResult[] {
  const topN = options.topN ?? answers.numStops;

  const { filtered, relaxed } = applyFiltersWithRelaxation(wineries, answers, topN);

  const scored: ScoredEntry[] = filtered.map((w) => {
    const breakdown = scoreWinery(w, answers);
    const reasons = generateReasons(w, answers, breakdown);
    return { winery: w, score: breakdown.total, reasons };
  });

  scored.sort(tieBreakCompare);
  const diversified = applyDiversity(scored, topN);

  const results: MatchResult[] = [];
  for (let i = 0; i < Math.min(diversified.length, topN); i++) {
    const entry = diversified[i];
    const fullWinery = wineryLookup.get(entry.winery.id);
    if (!fullWinery) continue;

    results.push({
      winery: fullWinery,
      rank: i + 1,
      score: entry.score,
      matchReasons: entry.reasons,
      ...(relaxed.length > 0 ? { filtersRelaxed: relaxed } : {}),
    });
  }

  return results;
}
