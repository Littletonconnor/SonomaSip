import type { QuizAnswers, StyleScores, WineryForMatching } from '../types';
import type { ScoreBreakdown } from './score';

type StyleKey = keyof StyleScores;

type Candidate = {
  text: string;
  priority: number;
};

export function generateReasons(
  winery: WineryForMatching,
  answers: QuizAnswers,
  breakdown: ScoreBreakdown,
  userWeights: Record<StyleKey, number>,
): string[] {
  const candidates: Candidate[] = [];

  const styleReasons: [StyleKey, number, string][] = [
    ['styleRelaxed', 0.5, 'Perfect for a relaxed, scenic afternoon'],
    ['styleEducational', 0.5, 'Great if you love learning about the winemaking process'],
    ['styleCelebratory', 0.5, 'A celebratory atmosphere for your special occasion'],
    ['styleSocial', 0.5, 'Lively social scene — great for groups'],
    ['styleAdventurous', 0.5, 'An adventurous experience off the beaten path'],
  ];

  for (const [key, threshold, text] of styleReasons) {
    if (userWeights[key] > threshold && winery.styleScores[key] >= 4) {
      candidates.push({ text, priority: 1 });
    }
  }

  if (breakdown.budget > 0.8 && winery.minFlightPrice !== null) {
    candidates.push({
      text: `Excellent value at $${winery.minFlightPrice} per tasting`,
      priority: 2,
    });
  }

  const matchedVarietals = answers.selectedVarietals.filter((v) => winery.varietals.includes(v));
  if (matchedVarietals.length > 0) {
    const label =
      matchedVarietals.length === 1 ? matchedVarietals[0] : matchedVarietals.join(' and ');
    candidates.push({
      text: `Known for ${label}, one of your favorites`,
      priority: 0,
    });
  }

  const mustHaveReasons: [boolean, boolean, string][] = [
    [
      answers.mustHaves.dogFriendly,
      winery.isDogFriendly,
      'Dog-friendly — bring your four-legged friend',
    ],
    [
      answers.mustHaves.kidFriendly,
      winery.isKidFriendly,
      'Family-friendly with activities for kids',
    ],
    [answers.mustHaves.views, winery.hasViews, `Stunning views of ${winery.region}`],
    [answers.mustHaves.foodPairing, winery.hasFoodPairing, 'Offers food pairings with tastings'],
    [answers.mustHaves.outdoorSeating, winery.hasOutdoorSeating, 'Beautiful outdoor seating area'],
    [
      answers.mustHaves.wheelchairAccessible,
      winery.isWheelchairAccessible,
      'Wheelchair accessible facilities',
    ],
  ];

  for (const [requested, has, text] of mustHaveReasons) {
    if (requested && has) {
      candidates.push({ text, priority: 0 });
    }
  }

  if (winery.reservationType === 'walk_ins_welcome') {
    candidates.push({
      text: 'Walk-ins welcome — no reservation needed',
      priority: 3,
    });
  }

  if (winery.ratingGoogle !== null && winery.ratingGoogle >= 4.5) {
    candidates.push({
      text: `Highly rated by visitors (${winery.ratingGoogle}★)`,
      priority: 3,
    });
  }

  if (
    answers.groupSize !== null &&
    answers.groupSize >= 6 &&
    winery.groupSizeMax !== null &&
    winery.groupSizeMax >= answers.groupSize
  ) {
    candidates.push({
      text: `Accommodates groups of ${answers.groupSize}+`,
      priority: 2,
    });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.slice(0, 5).map((c) => c.text);
}
