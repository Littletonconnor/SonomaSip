import type {
  GroupComposition,
  NoiseLevel,
  QuizAnswers,
  WineryForMatching,
} from '../types';
import { getBudgetCeiling } from './filters';

function scoreArchetype(winery: WineryForMatching, answers: QuizAnswers): number {
  if (!answers.archetype) return 0.5;
  const raw = winery.archetypeScores[answers.archetype];
  if (typeof raw !== 'number') return 0;
  return Math.max(0, Math.min(1, raw / 10));
}

function scoreBudget(winery: WineryForMatching, answers: QuizAnswers): number {
  const ceiling = getBudgetCeiling(answers.budgetBand);
  if (ceiling === null) return 0.5;
  if (winery.minFlightPrice === null) return 0.5;

  const ratio = winery.minFlightPrice / ceiling;
  return Math.max(0, Math.min(1, 1.0 - Math.abs(ratio - 0.7)));
}

function scoreExperience(winery: WineryForMatching, answers: QuizAnswers): number {
  const mustHaveChecks: [boolean, boolean][] = [
    [answers.mustHaves.views, winery.hasViews],
    [answers.mustHaves.foodPairing, winery.hasFoodPairing],
    [answers.mustHaves.outdoorSeating, winery.hasOutdoorSeating],
    [answers.mustHaves.dogFriendly, winery.isDogFriendly],
    [answers.mustHaves.kidFriendly, winery.kidWelcome],
    [answers.mustHaves.picnic, winery.hasPicnic],
    [answers.mustHaves.walkInsWelcome, winery.reservationType === 'walk_ins_welcome'],
  ];

  const totalRequested = mustHaveChecks.filter(([required]) => required).length;

  if (totalRequested > 0) {
    const matched = mustHaveChecks.filter(([required, has]) => required && has).length;
    return matched / totalRequested;
  }

  const bonusFeatures = [winery.hasViews, winery.hasFoodPairing, winery.hasOutdoorSeating].filter(
    Boolean,
  ).length;
  return bonusFeatures / mustHaveChecks.length;
}

function normalize(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function scoreRating(winery: WineryForMatching): number {
  const sources: [number | null, number][] = [
    [winery.qualityScore, 0.4],
    [winery.popularityScore, 0.3],
    [winery.ratingGoogle, 0.3],
  ];

  const available = sources.filter(([val]) => val !== null) as [number, number][];
  if (available.length === 0) return 0.5;

  const totalWeight = available.reduce((sum, [, w]) => sum + w, 0);
  let score = 0;
  for (const [val, w] of available) {
    score += (w / totalWeight) * normalize(val, 1, 5);
  }

  return score;
}

const PREFERRED_NOISE: Record<GroupComposition, NoiseLevel> = {
  solo: 'quiet',
  couple: 'quiet',
  small_group: 'moderate',
  big_group: 'lively',
};

function scoreGroupFit(winery: WineryForMatching, answers: QuizAnswers): number {
  if (!answers.groupComposition) return 0.5;
  return winery.noiseLevel === PREFERRED_NOISE[answers.groupComposition] ? 1 : 0.5;
}

export type ScoreBreakdown = {
  total: number;
  archetype: number;
  budget: number;
  experience: number;
  rating: number;
  groupFit: number;
};

export function scoreWinery(
  winery: WineryForMatching,
  answers: QuizAnswers,
): ScoreBreakdown {
  const archetype = scoreArchetype(winery, answers);
  const budget = scoreBudget(winery, answers);
  const experience = scoreExperience(winery, answers);
  const rating = scoreRating(winery);
  const groupFit = scoreGroupFit(winery, answers);

  const raw = archetype * 40 + budget * 20 + experience * 20 + rating * 15 + groupFit * 5;
  const total = Math.max(0, Math.min(100, Math.round(raw)));

  return { total, archetype, budget, experience, rating, groupFit };
}
