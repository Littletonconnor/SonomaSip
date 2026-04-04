import type { QuizAnswers, StyleScores, Vibe, WineryForMatching } from '../types';
import { getBudgetCeiling } from './filters';

type StyleKey = keyof StyleScores;

const STYLE_KEYS: StyleKey[] = [
  'styleRelaxed',
  'styleAdventurous',
  'styleEducational',
  'styleCelebratory',
  'styleSocial',
];

const VIBE_WEIGHTS: Record<Vibe, Record<StyleKey, number>> = {
  'Relaxed & Scenic': {
    styleRelaxed: 1.0,
    styleAdventurous: 0.1,
    styleEducational: 0.1,
    styleCelebratory: 0.0,
    styleSocial: 0.0,
  },
  Adventurous: {
    styleRelaxed: 0.1,
    styleAdventurous: 1.0,
    styleEducational: 0.2,
    styleCelebratory: 0.0,
    styleSocial: 0.1,
  },
  Educational: {
    styleRelaxed: 0.2,
    styleAdventurous: 0.2,
    styleEducational: 1.0,
    styleCelebratory: 0.0,
    styleSocial: 0.0,
  },
  Celebratory: {
    styleRelaxed: 0.1,
    styleAdventurous: 0.1,
    styleEducational: 0.0,
    styleCelebratory: 1.0,
    styleSocial: 0.3,
  },
  'Social & Lively': {
    styleRelaxed: 0.0,
    styleAdventurous: 0.1,
    styleEducational: 0.0,
    styleCelebratory: 0.3,
    styleSocial: 1.0,
  },
};

const UNIFORM_WEIGHT = 0.2;

export function computeUserWeights(answers: QuizAnswers): Record<StyleKey, number> {
  const weights: Record<StyleKey, number> = {
    styleRelaxed: 0,
    styleAdventurous: 0,
    styleEducational: 0,
    styleCelebratory: 0,
    styleSocial: 0,
  };

  if (answers.selectedVibes.length === 0) {
    for (const k of STYLE_KEYS) weights[k] = UNIFORM_WEIGHT;
  } else {
    for (const vibe of answers.selectedVibes) {
      const vw = VIBE_WEIGHTS[vibe];
      for (const k of STYLE_KEYS) weights[k] += vw[k];
    }
    const count = answers.selectedVibes.length;
    for (const k of STYLE_KEYS) weights[k] /= count;
  }

  if (answers.groupSize === 2) {
    weights.styleRelaxed += 0.1;
    weights.styleCelebratory += 0.1;
  } else if (answers.groupSize !== null && answers.groupSize >= 8) {
    weights.styleSocial += 0.2;
  } else if (answers.groupSize !== null && answers.groupSize >= 6) {
    weights.styleSocial += 0.1;
  }

  return weights;
}

function scoreStyle(winery: WineryForMatching, userWeights: Record<StyleKey, number>): number {
  const totalWeight = STYLE_KEYS.reduce((sum, k) => sum + userWeights[k], 0);
  if (totalWeight === 0) return 0.5;

  let weightedMatch = 0;
  for (const k of STYLE_KEYS) {
    const wineryNorm = winery.styleScores[k] / 5;
    const diff = Math.abs(userWeights[k] - wineryNorm);
    const match = 1 - diff;
    weightedMatch += userWeights[k] * match;
  }

  return weightedMatch / totalWeight;
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
    [answers.mustHaves.kidFriendly, winery.isKidFriendly],
    [answers.mustHaves.wheelchairAccessible, winery.isWheelchairAccessible],
  ];

  const totalMustHaves = mustHaveChecks.filter(([required]) => required).length;

  if (totalMustHaves > 0) {
    const matched = mustHaveChecks.filter(([required, has]) => required && has).length;
    return matched / totalMustHaves;
  }

  const bonusFeatures = [winery.hasViews, winery.hasFoodPairing, winery.hasOutdoorSeating].filter(
    Boolean,
  ).length;
  return bonusFeatures / 6;
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

export type ScoreBreakdown = {
  total: number;
  style: number;
  budget: number;
  experience: number;
  rating: number;
  membersOnlyPenalty: number;
};

export function scoreWinery(
  winery: WineryForMatching,
  answers: QuizAnswers,
  userWeights: Record<StyleKey, number>,
): ScoreBreakdown {
  const style = scoreStyle(winery, userWeights);
  const budget = scoreBudget(winery, answers);
  const experience = scoreExperience(winery, answers);
  const rating = scoreRating(winery);
  const membersOnlyPenalty = winery.isMembersOnly && answers.includeMembersOnly ? -10 : 0;

  const raw = style * 40 + budget * 20 + experience * 20 + rating * 15 + membersOnlyPenalty;
  const total = Math.max(0, Math.min(100, Math.round(raw)));

  return { total, style, budget, experience, rating, membersOnlyPenalty };
}
