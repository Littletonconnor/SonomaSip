import { describe, expect, it } from 'vitest';
import type { QuizAnswers, Winery, WineryForMatching } from '../types';
import { recommend } from './index';

function makeWinery(id: string, overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id,
    slug: id,
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

function makeFullWinery(id: string, region = 'Russian River Valley'): Winery {
  return {
    id,
    slug: id,
    name: id.replace(/-/g, ' '),
    tagline: '',
    story: '',
    region,
    city: 'Healdsburg',
    latitude: 38.6,
    longitude: -122.8,
    setting: null,
    hours: {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    },
    reservationType: 'walk_ins_welcome',
    bookingUrl: '',
    groupSizeMax: null,
    parking: '',
    varietals: ['Pinot Noir'],
    signatureVarietals: ['Pinot Noir'],
    vibes: [],
    noiseLevel: 'moderate',
    styleScores: {
      styleRelaxed: 4,
      styleAdventurous: 2,
      styleEducational: 3,
      styleCelebratory: 2,
      styleSocial: 3,
    },
    minFlightPrice: 40,
    maxFlightPrice: 80,
    flights: [],
    isDogFriendly: true,
    isKidFriendly: true,
    isWheelchairAccessible: false,
    hasFoodPairing: true,
    hasOutdoorSeating: true,
    hasViews: true,
    isMembersOnly: false,
    averageRating: 4.5,
    ratingsCount: 100,
    qualityScore: 4,
    popularityScore: 3,
    ratingGoogle: 4.5,
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

function buildLookup(wineries: WineryForMatching[]): Map<string, Winery> {
  return new Map(wineries.map((w) => [w.id, makeFullWinery(w.id, w.region)]));
}

describe('recommend', () => {
  it('returns ranked results limited by numStops', () => {
    const wineries = ['a', 'b', 'c', 'd', 'e'].map((id) => makeWinery(id));
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ numStops: 3 }), lookup);

    expect(results).toHaveLength(3);
    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);
    expect(results[2].rank).toBe(3);
  });

  it('returns fewer results if not enough pass filters', () => {
    const wineries = [
      makeWinery('a', { varietals: ['Pinot Noir'] }),
      makeWinery('b', { varietals: ['Zinfandel'] }),
    ];
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ selectedVarietals: ['Pinot Noir'], numStops: 5 }),
      lookup,
    );
    expect(results).toHaveLength(1);
  });

  it('produces deterministic results for same input', () => {
    const wineries = ['a', 'b', 'c', 'd', 'e'].map((id) => makeWinery(id));
    const lookup = buildLookup(wineries);
    const answers = makeAnswers({ selectedVibes: ['Relaxed & Scenic'] });

    const run1 = recommend(wineries, answers, lookup);
    const run2 = recommend(wineries, answers, lookup);
    expect(run1.map((r) => r.winery.id)).toEqual(run2.map((r) => r.winery.id));
  });

  it('scores are monotonically non-increasing', () => {
    const wineries = Array.from({ length: 10 }, (_, i) =>
      makeWinery(`w${i}`, {
        styleScores: {
          styleRelaxed: (i % 5) + 1,
          styleAdventurous: 3,
          styleEducational: 3,
          styleCelebratory: 3,
          styleSocial: 3,
        },
      }),
    );
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ selectedVibes: ['Relaxed & Scenic'], numStops: 10 }),
      lookup,
    );

    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it('includes match reasons', () => {
    const wineries = [makeWinery('a')];
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ selectedVibes: ['Relaxed & Scenic'] }),
      lookup,
    );
    expect(results[0].matchReasons.length).toBeGreaterThan(0);
  });

  it('applies geographic diversity — demotes 3rd winery from same region', () => {
    const wineries = [
      makeWinery('rrv-1', { region: 'Russian River Valley', qualityScore: 5, ratingGoogle: 5 }),
      makeWinery('rrv-2', { region: 'Russian River Valley', qualityScore: 5, ratingGoogle: 4.9 }),
      makeWinery('rrv-3', { region: 'Russian River Valley', qualityScore: 5, ratingGoogle: 4.8 }),
      makeWinery('dc-1', { region: 'Dry Creek Valley', qualityScore: 4, ratingGoogle: 4.0 }),
      makeWinery('sv-1', { region: 'Sonoma Valley', qualityScore: 3, ratingGoogle: 3.5 }),
      makeWinery('av-1', { region: 'Alexander Valley', qualityScore: 3, ratingGoogle: 3.0 }),
    ];
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ numStops: 5 }), lookup);

    const top5Regions = results.map((r) => r.winery.region);
    const rrCount = top5Regions.filter((r) => r === 'Russian River Valley').length;
    expect(rrCount).toBeLessThanOrEqual(2);
  });

  it('skips diversity when fewer than 3 regions in candidate set', () => {
    const wineries = [
      makeWinery('a', { region: 'Russian River Valley', qualityScore: 5 }),
      makeWinery('b', { region: 'Russian River Valley', qualityScore: 4 }),
      makeWinery('c', { region: 'Russian River Valley', qualityScore: 3 }),
      makeWinery('d', { region: 'Dry Creek Valley', qualityScore: 2 }),
    ];
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ numStops: 5 }), lookup);

    const rrCount = results.filter((r) => r.winery.region === 'Russian River Valley').length;
    expect(rrCount).toBe(3);
  });

  it('respects topN override', () => {
    const wineries = ['a', 'b', 'c', 'd', 'e'].map((id) => makeWinery(id));
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ numStops: 3 }), lookup, { topN: 2 });
    expect(results).toHaveLength(2);
  });

  it('returns empty array when all wineries filtered out', () => {
    const wineries = [makeWinery('a', { varietals: ['Syrah'] })];
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ selectedVarietals: ['Pinot Noir'] }), lookup);
    expect(results).toEqual([]);
  });
});
