import type { QuizAnswers } from '../../types';

const NO_MUST_HAVES = {
  views: false,
  foodPairing: false,
  outdoorSeating: false,
  dogFriendly: false,
  kidFriendly: false,
  wheelchairAccessible: false,
};

export const casualCouple: QuizAnswers = {
  selectedVarietals: ['Pinot Noir'],
  selectedVibes: ['Relaxed & Scenic'],
  budgetBand: '$$',
  mustHaves: { ...NO_MUST_HAVES, views: true, outdoorSeating: true },
  preferredRegions: ['Russian River Valley'],
  numStops: 3,
  includeMembersOnly: false,
  groupSize: 2,
};

export const luxuryGroup: QuizAnswers = {
  selectedVarietals: ['Cabernet Sauvignon', 'Sparkling'],
  selectedVibes: ['Celebratory', 'Social & Lively'],
  budgetBand: '$$$$',
  mustHaves: { ...NO_MUST_HAVES, foodPairing: true },
  preferredRegions: [],
  numStops: 4,
  includeMembersOnly: true,
  groupSize: 6,
};

export const familyTrip: QuizAnswers = {
  selectedVarietals: [],
  selectedVibes: [],
  budgetBand: '$',
  mustHaves: { ...NO_MUST_HAVES, kidFriendly: true, dogFriendly: true },
  preferredRegions: ['Sonoma Valley', 'Carneros'],
  numStops: 2,
  includeMembersOnly: false,
  groupSize: 4,
};

export const veryRestrictive: QuizAnswers = {
  selectedVarietals: ['Syrah'],
  selectedVibes: ['Educational'],
  budgetBand: '$',
  mustHaves: { ...NO_MUST_HAVES, wheelchairAccessible: true, views: true, foodPairing: true },
  preferredRegions: ['Alexander Valley'],
  numStops: 3,
  includeMembersOnly: false,
  groupSize: 8,
};

export const wideOpen: QuizAnswers = {
  selectedVarietals: [],
  selectedVibes: ['Adventurous'],
  budgetBand: null,
  mustHaves: NO_MUST_HAVES,
  preferredRegions: [],
  numStops: 5,
  includeMembersOnly: false,
  groupSize: null,
};

export const allDefaults: QuizAnswers = {
  selectedVarietals: [],
  selectedVibes: [],
  budgetBand: null,
  mustHaves: NO_MUST_HAVES,
  preferredRegions: [],
  numStops: 3,
  includeMembersOnly: false,
  groupSize: null,
};

export const singleRegionBudget: QuizAnswers = {
  selectedVarietals: ['Chardonnay'],
  selectedVibes: ['Relaxed & Scenic'],
  budgetBand: '$',
  mustHaves: NO_MUST_HAVES,
  preferredRegions: ['Carneros'],
  numStops: 3,
  includeMembersOnly: false,
  groupSize: 2,
};

export const allProfiles = {
  casualCouple,
  luxuryGroup,
  familyTrip,
  veryRestrictive,
  wideOpen,
  allDefaults,
  singleRegionBudget,
} as const;
