import { describe, expect, it } from 'vitest';
import type { QuizAnswers, WineryForMatching } from '../types';
import { computeUserWeights, scoreWinery } from './score';

function makeWinery(overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id: 'test-winery',
    slug: 'test-winery',
    region: 'Russian River Valley',
    reservationType: 'walk_ins_welcome',
    isMembersOnly: false,
    groupSizeMax: null,
    varietals: ['Pinot Noir', 'Chardonnay'],
    minFlightPrice: 40,
    isDogFriendly: true,
    isKidFriendly: true,
    isWheelchairAccessible: false,
    hasFoodPairing: true,
    hasOutdoorSeating: true,
    hasViews: true,
    styleScores: {
      styleRelaxed: 4,
      styleAdventurous: 2,
      styleEducational: 3,
      styleCelebratory: 2,
      styleSocial: 3,
    },
    qualityScore: 4,
    popularityScore: 3,
    ratingGoogle: 4.5,
    ...overrides,
  };
}

function makeAnswers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    selectedVarietals: [],
    selectedVibes: [],
    budgetBand: null,
    mustHaves: {
      views: false,
      foodPairing: false,
      outdoorSeating: false,
      dogFriendly: false,
      kidFriendly: false,
      wheelchairAccessible: false,
    },
    preferredRegions: [],
    numStops: 3,
    includeMembersOnly: false,
    groupSize: null,
    ...overrides,
  };
}

describe('computeUserWeights', () => {
  it('returns uniform weights when no vibes selected', () => {
    const weights = computeUserWeights(makeAnswers());
    expect(weights.styleRelaxed).toBe(0.2);
    expect(weights.styleAdventurous).toBe(0.2);
    expect(weights.styleEducational).toBe(0.2);
    expect(weights.styleCelebratory).toBe(0.2);
    expect(weights.styleSocial).toBe(0.2);
  });

  it('returns correct weights for single vibe', () => {
    const weights = computeUserWeights(makeAnswers({ selectedVibes: ['Relaxed & Scenic'] }));
    expect(weights.styleRelaxed).toBe(1.0);
    expect(weights.styleAdventurous).toBe(0.1);
    expect(weights.styleEducational).toBe(0.1);
    expect(weights.styleCelebratory).toBe(0.0);
    expect(weights.styleSocial).toBe(0.0);
  });

  it('averages weights for multiple vibes', () => {
    const weights = computeUserWeights(
      makeAnswers({ selectedVibes: ['Celebratory', 'Social & Lively'] }),
    );
    expect(weights.styleCelebratory).toBeCloseTo(0.65);
    expect(weights.styleSocial).toBeCloseTo(0.65);
  });

  it('applies group size bonus for couples', () => {
    const weights = computeUserWeights(makeAnswers({ groupSize: 2 }));
    expect(weights.styleRelaxed).toBeCloseTo(0.3);
    expect(weights.styleCelebratory).toBeCloseTo(0.3);
  });

  it('applies group size bonus for large groups', () => {
    const weights = computeUserWeights(makeAnswers({ groupSize: 8 }));
    expect(weights.styleSocial).toBeCloseTo(0.4);
  });
});

describe('scoreWinery', () => {
  it('returns a score between 0 and 100', () => {
    const answers = makeAnswers({ selectedVibes: ['Relaxed & Scenic'] });
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(makeWinery(), answers, weights);
    expect(breakdown.total).toBeGreaterThanOrEqual(0);
    expect(breakdown.total).toBeLessThanOrEqual(100);
  });

  it('scores higher for style-aligned wineries', () => {
    const answers = makeAnswers({ selectedVibes: ['Relaxed & Scenic'] });
    const weights = computeUserWeights(answers);

    const relaxedWinery = makeWinery({
      styleScores: {
        styleRelaxed: 5,
        styleAdventurous: 1,
        styleEducational: 1,
        styleCelebratory: 1,
        styleSocial: 1,
      },
    });
    const adventurousWinery = makeWinery({
      styleScores: {
        styleRelaxed: 1,
        styleAdventurous: 5,
        styleEducational: 1,
        styleCelebratory: 1,
        styleSocial: 1,
      },
    });

    const relaxedScore = scoreWinery(relaxedWinery, answers, weights);
    const adventurousScore = scoreWinery(adventurousWinery, answers, weights);
    expect(relaxedScore.style).toBeGreaterThan(adventurousScore.style);
  });

  it('applies members-only penalty', () => {
    const answers = makeAnswers({ includeMembersOnly: true });
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(makeWinery({ isMembersOnly: true }), answers, weights);
    expect(breakdown.membersOnlyPenalty).toBe(-10);
  });

  it('no penalty for non-members-only wineries', () => {
    const answers = makeAnswers();
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(makeWinery(), answers, weights);
    expect(breakdown.membersOnlyPenalty).toBe(0);
  });

  it('gives neutral budget score when no budget set', () => {
    const answers = makeAnswers({ budgetBand: null });
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(makeWinery(), answers, weights);
    expect(breakdown.budget).toBe(0.5);
  });

  it('scores budget proximity around 70% sweet spot', () => {
    const answers = makeAnswers({ budgetBand: '$$' });
    const weights = computeUserWeights(answers);

    const sweetSpot = scoreWinery(makeWinery({ minFlightPrice: 45 }), answers, weights);
    const tooExpensive = scoreWinery(makeWinery({ minFlightPrice: 64 }), answers, weights);
    expect(sweetSpot.budget).toBeGreaterThan(tooExpensive.budget);
  });

  it('handles null ratings gracefully', () => {
    const answers = makeAnswers();
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(
      makeWinery({ qualityScore: null, popularityScore: null, ratingGoogle: null }),
      answers,
      weights,
    );
    expect(breakdown.rating).toBe(0.5);
  });

  it('redistributes rating weight when some scores are null', () => {
    const answers = makeAnswers();
    const weights = computeUserWeights(answers);
    const withAll = scoreWinery(
      makeWinery({ qualityScore: 4, popularityScore: 4, ratingGoogle: 4.0 }),
      answers,
      weights,
    );
    const withOne = scoreWinery(
      makeWinery({ qualityScore: 4, popularityScore: null, ratingGoogle: null }),
      answers,
      weights,
    );
    expect(withAll.rating).toBeCloseTo(withOne.rating, 1);
  });

  it('gives experience bonus for must-have matches', () => {
    const answers = makeAnswers({
      mustHaves: {
        views: true,
        foodPairing: true,
        outdoorSeating: false,
        dogFriendly: false,
        kidFriendly: false,
        wheelchairAccessible: false,
      },
    });
    const weights = computeUserWeights(answers);
    const breakdown = scoreWinery(
      makeWinery({ hasViews: true, hasFoodPairing: true }),
      answers,
      weights,
    );
    expect(breakdown.experience).toBe(1.0);
  });

  it('gives small amenity bonus when no must-haves selected', () => {
    const answers = makeAnswers();
    const weights = computeUserWeights(answers);
    const withAmenities = scoreWinery(
      makeWinery({ hasViews: true, hasFoodPairing: true, hasOutdoorSeating: true }),
      answers,
      weights,
    );
    const withoutAmenities = scoreWinery(
      makeWinery({ hasViews: false, hasFoodPairing: false, hasOutdoorSeating: false }),
      answers,
      weights,
    );
    expect(withAmenities.experience).toBeGreaterThan(withoutAmenities.experience);
  });
});
