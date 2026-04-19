import type { Archetype, QuizAnswers, WineryForMatching } from '../types';
import type { ScoreBreakdown } from './score';

type Candidate = {
  text: string;
  priority: number;
};

const ARCHETYPE_REASONS: Record<Archetype, string> = {
  explorer: "An explorer's pick — off-the-beaten-path, unexpected finds",
  collector: "A collector's pick — library releases and winemaker conversations",
  student: "A student's pick — deep winemaking education",
  socializer: "A socializer's pick — lively, group-friendly energy",
  romantic: "A romantic's pick — intimate, scenic, memorable",
};

export function generateReasons(
  winery: WineryForMatching,
  answers: QuizAnswers,
  breakdown: ScoreBreakdown,
): string[] {
  const candidates: Candidate[] = [];

  if (answers.archetype && breakdown.archetype >= 0.7) {
    candidates.push({ text: ARCHETYPE_REASONS[answers.archetype], priority: 0 });
  }

  if (breakdown.budget > 0.8 && winery.minFlightPrice !== null) {
    candidates.push({
      text: `Excellent value at $${winery.minFlightPrice} per tasting`,
      priority: 2,
    });
  }

  const mustHaveReasons: [boolean, boolean, string][] = [
    [answers.mustHaves.dogFriendly, winery.isDogFriendly, 'Dog-friendly — bring your four-legged friend'],
    [answers.mustHaves.kidFriendly, winery.kidWelcome, 'Family-friendly with activities for kids'],
    [answers.mustHaves.views, winery.hasViews, `Stunning views of ${winery.region}`],
    [answers.mustHaves.foodPairing, winery.hasFoodPairing, 'Offers food pairings with tastings'],
    [answers.mustHaves.outdoorSeating, winery.hasOutdoorSeating, 'Beautiful outdoor seating area'],
    [answers.mustHaves.picnic, winery.hasPicnic, 'Picnic-friendly — bring a spread'],
    [
      answers.mustHaves.walkInsWelcome,
      winery.reservationType === 'walk_ins_welcome',
      'Walk-ins welcome — no reservation needed',
    ],
  ];

  for (const [requested, has, text] of mustHaveReasons) {
    if (requested && has) candidates.push({ text, priority: 1 });
  }

  if (!answers.mustHaves.walkInsWelcome && winery.reservationType === 'walk_ins_welcome') {
    candidates.push({ text: 'Walk-ins welcome — no reservation needed', priority: 3 });
  }

  if (winery.ratingGoogle !== null && winery.ratingGoogle >= 4.5) {
    candidates.push({
      text: `Highly rated by visitors (${winery.ratingGoogle}★)`,
      priority: 3,
    });
  }

  if (answers.groupComposition === 'big_group' && (winery.groupCapacity ?? 0) >= 6) {
    candidates.push({ text: 'Accommodates bigger groups', priority: 2 });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.slice(0, 5).map((c) => c.text);
}
