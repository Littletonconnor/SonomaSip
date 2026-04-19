import type { MustHaves, QuizAnswers } from '../../types';

const NO_MUST_HAVES: MustHaves = {
  views: false,
  foodPairing: false,
  outdoorSeating: false,
  dogFriendly: false,
  kidFriendly: false,
  picnic: false,
  walkInsWelcome: false,
};

export const casualCouple: QuizAnswers = {
  archetype: 'romantic',
  groupComposition: 'couple',
  budgetBand: '$$',
  mustHaves: { ...NO_MUST_HAVES, views: true, outdoorSeating: true },
  skipVarietals: [],
  preferredRegions: ['Russian River Valley'],
  numStops: 3,
};

export const luxuryGroup: QuizAnswers = {
  archetype: 'collector',
  groupComposition: 'big_group',
  budgetBand: '$$$$',
  mustHaves: { ...NO_MUST_HAVES, foodPairing: true },
  skipVarietals: [],
  preferredRegions: [],
  numStops: 4,
};

export const familyTrip: QuizAnswers = {
  archetype: 'socializer',
  groupComposition: 'small_group',
  budgetBand: '$',
  mustHaves: { ...NO_MUST_HAVES, kidFriendly: true, dogFriendly: true },
  skipVarietals: [],
  preferredRegions: ['Sonoma Valley', 'Carneros'],
  numStops: 2,
};

export const veryRestrictive: QuizAnswers = {
  archetype: 'student',
  groupComposition: 'big_group',
  budgetBand: '$',
  mustHaves: { ...NO_MUST_HAVES, views: true, foodPairing: true },
  skipVarietals: ['Zinfandel'],
  preferredRegions: ['Alexander Valley'],
  numStops: 3,
};

export const wideOpen: QuizAnswers = {
  archetype: 'explorer',
  groupComposition: null,
  budgetBand: null,
  mustHaves: NO_MUST_HAVES,
  skipVarietals: [],
  preferredRegions: [],
  numStops: 5,
};

export const allDefaults: QuizAnswers = {
  archetype: null,
  groupComposition: null,
  budgetBand: null,
  mustHaves: NO_MUST_HAVES,
  skipVarietals: [],
  preferredRegions: [],
  numStops: 3,
};

export const singleRegionBudget: QuizAnswers = {
  archetype: 'romantic',
  groupComposition: 'couple',
  budgetBand: '$',
  mustHaves: NO_MUST_HAVES,
  skipVarietals: [],
  preferredRegions: ['Carneros'],
  numStops: 3,
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
