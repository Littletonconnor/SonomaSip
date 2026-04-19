import { describe, expect, it } from 'vitest';
import type { MustHaves, QuizAnswers, WineryForMatching } from '../types';
import { scoreWinery } from './score';

const NO_MUST_HAVES: MustHaves = {
  views: false,
  foodPairing: false,
  outdoorSeating: false,
  dogFriendly: false,
  kidFriendly: false,
  picnic: false,
  walkInsWelcome: false,
};

function makeWinery(overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id: 'test-winery',
    slug: 'test-winery',
    region: 'Russian River Valley',
    regionSecondary: null,
    reservationType: 'walk_ins_welcome',
    isMembersOnly: false,
    groupCapacity: null,
    varietals: ['Pinot Noir', 'Chardonnay'],
    houseSpecialty: [],
    minFlightPrice: 40,
    isDogFriendly: true,
    kidWelcome: true,
    isWheelchairAccessible: false,
    hasFoodPairing: true,
    hasOutdoorSeating: true,
    hasViews: true,
    hasPicnic: false,
    styleScores: {
      styleRelaxed: 4,
      styleAdventurous: 2,
      styleEducational: 3,
      styleCelebratory: 2,
      styleSocial: 3,
    },
    archetypeScores: {},
    noiseLevel: 'moderate',
    qualityScore: 4,
    popularityScore: 3,
    ratingGoogle: 4.5,
    ...overrides,
  };
}

function makeAnswers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    archetype: null,
    groupComposition: null,
    budgetBand: null,
    mustHaves: NO_MUST_HAVES,
    skipVarietals: [],
    preferredRegions: [],
    numStops: 3,
    ...overrides,
  };
}

describe('scoreWinery', () => {
  it('returns a score between 0 and 100', () => {
    const breakdown = scoreWinery(makeWinery(), makeAnswers());
    expect(breakdown.total).toBeGreaterThanOrEqual(0);
    expect(breakdown.total).toBeLessThanOrEqual(100);
  });

  it('rewards wineries with high archetype scores for the selected archetype', () => {
    const answers = makeAnswers({ archetype: 'explorer' });
    const high = scoreWinery(
      makeWinery({ archetypeScores: { explorer: 10 } }),
      answers,
    );
    const low = scoreWinery(
      makeWinery({ archetypeScores: { explorer: 1 } }),
      answers,
    );
    expect(high.archetype).toBeGreaterThan(low.archetype);
    expect(high.total).toBeGreaterThan(low.total);
  });

  it('gives zero archetype score when the selected key is missing', () => {
    const breakdown = scoreWinery(
      makeWinery({ archetypeScores: { collector: 10 } }),
      makeAnswers({ archetype: 'explorer' }),
    );
    expect(breakdown.archetype).toBe(0);
  });

  it('gives neutral archetype score when no archetype is selected', () => {
    const breakdown = scoreWinery(makeWinery(), makeAnswers({ archetype: null }));
    expect(breakdown.archetype).toBe(0.5);
  });

  it('gives neutral budget score when no budget set', () => {
    const breakdown = scoreWinery(makeWinery(), makeAnswers({ budgetBand: null }));
    expect(breakdown.budget).toBe(0.5);
  });

  it('scores budget proximity around 70% sweet spot', () => {
    const answers = makeAnswers({ budgetBand: '$$' });
    const sweetSpot = scoreWinery(makeWinery({ minFlightPrice: 45 }), answers);
    const tooExpensive = scoreWinery(makeWinery({ minFlightPrice: 64 }), answers);
    expect(sweetSpot.budget).toBeGreaterThan(tooExpensive.budget);
  });

  it('handles null ratings gracefully', () => {
    const breakdown = scoreWinery(
      makeWinery({ qualityScore: null, popularityScore: null, ratingGoogle: null }),
      makeAnswers(),
    );
    expect(breakdown.rating).toBe(0.5);
  });

  it('redistributes rating weight when some scores are null', () => {
    const withAll = scoreWinery(
      makeWinery({ qualityScore: 4, popularityScore: 4, ratingGoogle: 4.0 }),
      makeAnswers(),
    );
    const withOne = scoreWinery(
      makeWinery({ qualityScore: 4, popularityScore: null, ratingGoogle: null }),
      makeAnswers(),
    );
    expect(withAll.rating).toBeCloseTo(withOne.rating, 1);
  });

  it('gives full experience score when all requested must-haves are present', () => {
    const answers = makeAnswers({
      mustHaves: { ...NO_MUST_HAVES, views: true, foodPairing: true },
    });
    const breakdown = scoreWinery(
      makeWinery({ hasViews: true, hasFoodPairing: true }),
      answers,
    );
    expect(breakdown.experience).toBe(1);
  });

  it('gives small amenity bonus when no must-haves selected', () => {
    const withAmenities = scoreWinery(
      makeWinery({ hasViews: true, hasFoodPairing: true, hasOutdoorSeating: true }),
      makeAnswers(),
    );
    const withoutAmenities = scoreWinery(
      makeWinery({ hasViews: false, hasFoodPairing: false, hasOutdoorSeating: false }),
      makeAnswers(),
    );
    expect(withAmenities.experience).toBeGreaterThan(withoutAmenities.experience);
  });

  it('rewards noise-level match for the selected group composition', () => {
    const couple = scoreWinery(
      makeWinery({ noiseLevel: 'quiet' }),
      makeAnswers({ groupComposition: 'couple' }),
    );
    const mismatched = scoreWinery(
      makeWinery({ noiseLevel: 'lively' }),
      makeAnswers({ groupComposition: 'couple' }),
    );
    expect(couple.groupFit).toBeGreaterThan(mismatched.groupFit);
  });
});
