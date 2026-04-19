import { describe, expect, it } from 'vitest';
import type { MustHaves, QuizAnswers, Winery, WineryForMatching } from '../types';
import { recommend } from './index';

const NO_MUST_HAVES: MustHaves = {
  views: false,
  foodPairing: false,
  outdoorSeating: false,
  dogFriendly: false,
  kidFriendly: false,
  picnic: false,
  walkInsWelcome: false,
};

function makeWinery(id: string, overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id,
    slug: id,
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
    archetypeScores: { explorer: 5, collector: 5, student: 5, socializer: 5, romantic: 5 },
    noiseLevel: 'moderate',
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
    groupCapacity: null,
    parking: '',
    varietals: ['Pinot Noir'],
    signatureVarietals: ['Pinot Noir'],
    houseSpecialty: [],
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
    kidWelcome: true,
    isWheelchairAccessible: false,
    hasFoodPairing: true,
    hasOutdoorSeating: true,
    hasViews: true,
    hasPicnic: false,
    isMembersOnly: false,
    averageRating: 4.5,
    ratingsCount: 100,
    qualityScore: 4,
    popularityScore: 3,
    ratingGoogle: 4.5,
    wineryScale: null,
    archetypeScores: { explorer: 5, collector: 5, student: 5, socializer: 5, romantic: 5 },
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

  it('returns fewer results if not enough wineries exist', () => {
    const wineries = [makeWinery('a'), makeWinery('b')];
    const lookup = buildLookup(wineries);
    const results = recommend(wineries, makeAnswers({ numStops: 5 }), lookup);
    expect(results).toHaveLength(2);
  });

  it('produces deterministic results for same input', () => {
    const wineries = ['a', 'b', 'c', 'd', 'e'].map((id) => makeWinery(id));
    const lookup = buildLookup(wineries);
    const answers = makeAnswers({ archetype: 'romantic' });

    const run1 = recommend(wineries, answers, lookup);
    const run2 = recommend(wineries, answers, lookup);
    expect(run1.map((r) => r.winery.id)).toEqual(run2.map((r) => r.winery.id));
  });

  it('scores are monotonically non-increasing', () => {
    const wineries = Array.from({ length: 10 }, (_, i) =>
      makeWinery(`w${i}`, {
        archetypeScores: { explorer: (i % 5) * 2 + 1 },
      }),
    );
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ archetype: 'explorer', numStops: 10 }),
      lookup,
    );

    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it('includes match reasons', () => {
    const wineries = [makeWinery('a', { archetypeScores: { romantic: 10 } })];
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ archetype: 'romantic' }),
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

  it('relaxes dealbreaker filter when strict filtering returns no results', () => {
    const wineries = [makeWinery('a', { houseSpecialty: ['Zinfandel'] })];
    const lookup = buildLookup(wineries);
    const results = recommend(
      wineries,
      makeAnswers({ skipVarietals: ['Zinfandel'] }),
      lookup,
    );
    expect(results).toHaveLength(1);
    expect(results[0].filtersRelaxed).toContain('dealbreaker');
  });

  it('Explorer vs Student return different top-ranked wineries', () => {
    const wineries = [
      makeWinery('hidden-gem', {
        archetypeScores: { explorer: 10, student: 2 },
      }),
      makeWinery('classroom', {
        archetypeScores: { explorer: 2, student: 10 },
      }),
    ];
    const lookup = buildLookup(wineries);
    const explorerResults = recommend(wineries, makeAnswers({ archetype: 'explorer' }), lookup);
    const studentResults = recommend(wineries, makeAnswers({ archetype: 'student' }), lookup);
    expect(explorerResults[0].winery.id).toBe('hidden-gem');
    expect(studentResults[0].winery.id).toBe('classroom');
  });
});
