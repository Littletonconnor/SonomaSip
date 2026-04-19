import { describe, expect, it } from 'vitest';
import type { MustHaves, QuizAnswers, WineryForMatching } from '../types';
import { applyHardFilters, getBudgetCeiling } from './filters';

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

describe('getBudgetCeiling', () => {
  it('returns correct ceilings', () => {
    expect(getBudgetCeiling('$')).toBe(35);
    expect(getBudgetCeiling('$$')).toBe(65);
    expect(getBudgetCeiling('$$$')).toBe(100);
  });

  it('returns null for $$$$ and null', () => {
    expect(getBudgetCeiling('$$$$')).toBeNull();
    expect(getBudgetCeiling(null)).toBeNull();
  });
});

describe('applyHardFilters', () => {
  it('passes all wineries when no filters active', () => {
    const wineries = [makeWinery(), makeWinery({ id: 'second' })];
    const result = applyHardFilters(wineries, makeAnswers());
    expect(result).toHaveLength(2);
  });

  describe('dealbreaker filter', () => {
    it('excludes wineries whose house_specialty intersects skipVarietals', () => {
      const result = applyHardFilters(
        [makeWinery({ houseSpecialty: ['Zinfandel'] })],
        makeAnswers({ skipVarietals: ['Zinfandel'] }),
      );
      expect(result).toHaveLength(0);
    });

    it('keeps wineries whose house_specialty does not intersect skipVarietals', () => {
      const result = applyHardFilters(
        [makeWinery({ houseSpecialty: ['Pinot Noir'] })],
        makeAnswers({ skipVarietals: ['Zinfandel'] }),
      );
      expect(result).toHaveLength(1);
    });

    it('does not consult winery.varietals — only houseSpecialty', () => {
      const result = applyHardFilters(
        [makeWinery({ houseSpecialty: [], varietals: ['Zinfandel'] })],
        makeAnswers({ skipVarietals: ['Zinfandel'] }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('budget filter', () => {
    it('keeps wineries at or below budget ceiling', () => {
      const result = applyHardFilters(
        [makeWinery({ minFlightPrice: 30 })],
        makeAnswers({ budgetBand: '$' }),
      );
      expect(result).toHaveLength(1);
    });

    it('removes wineries above budget ceiling', () => {
      const result = applyHardFilters(
        [makeWinery({ minFlightPrice: 50 })],
        makeAnswers({ budgetBand: '$' }),
      );
      expect(result).toHaveLength(0);
    });

    it('passes wineries with null minFlightPrice (benefit of the doubt)', () => {
      const result = applyHardFilters(
        [makeWinery({ minFlightPrice: null })],
        makeAnswers({ budgetBand: '$' }),
      );
      expect(result).toHaveLength(1);
    });

    it('skips budget filter for $$$$', () => {
      const result = applyHardFilters(
        [makeWinery({ minFlightPrice: 500 })],
        makeAnswers({ budgetBand: '$$$$' }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('region filter', () => {
    it('keeps wineries in preferred regions', () => {
      const result = applyHardFilters(
        [makeWinery({ region: 'Dry Creek Valley' })],
        makeAnswers({ preferredRegions: ['Dry Creek Valley', 'Sonoma Valley'] }),
      );
      expect(result).toHaveLength(1);
    });

    it('removes wineries not in preferred regions', () => {
      const result = applyHardFilters(
        [makeWinery({ region: 'Alexander Valley' })],
        makeAnswers({ preferredRegions: ['Dry Creek Valley'] }),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('must-have filters', () => {
    it('removes wineries missing a required must-have', () => {
      const result = applyHardFilters(
        [makeWinery({ hasPicnic: false })],
        makeAnswers({ mustHaves: { ...NO_MUST_HAVES, picnic: true } }),
      );
      expect(result).toHaveLength(0);
    });

    it('keeps wineries that have all required must-haves', () => {
      const result = applyHardFilters(
        [makeWinery({ hasViews: true, hasFoodPairing: true })],
        makeAnswers({ mustHaves: { ...NO_MUST_HAVES, views: true, foodPairing: true } }),
      );
      expect(result).toHaveLength(1);
    });

    it('walkInsWelcome checks reservationType', () => {
      const excluded = applyHardFilters(
        [makeWinery({ reservationType: 'reservations_recommended' })],
        makeAnswers({ mustHaves: { ...NO_MUST_HAVES, walkInsWelcome: true } }),
      );
      expect(excluded).toHaveLength(0);

      const included = applyHardFilters(
        [makeWinery({ reservationType: 'walk_ins_welcome' })],
        makeAnswers({ mustHaves: { ...NO_MUST_HAVES, walkInsWelcome: true } }),
      );
      expect(included).toHaveLength(1);
    });
  });

  describe('group composition filter', () => {
    it('excludes wineries with capacity < 6 for big_group', () => {
      const result = applyHardFilters(
        [makeWinery({ groupCapacity: 4 })],
        makeAnswers({ groupComposition: 'big_group' }),
      );
      expect(result).toHaveLength(0);
    });

    it('passes wineries with null capacity (unknown)', () => {
      const result = applyHardFilters(
        [makeWinery({ groupCapacity: null })],
        makeAnswers({ groupComposition: 'big_group' }),
      );
      expect(result).toHaveLength(1);
    });

    it('solo always passes regardless of capacity', () => {
      const result = applyHardFilters(
        [makeWinery({ groupCapacity: 2 })],
        makeAnswers({ groupComposition: 'solo' }),
      );
      expect(result).toHaveLength(1);
    });

    it('couple requires capacity >= 2', () => {
      const result = applyHardFilters(
        [makeWinery({ groupCapacity: 1 })],
        makeAnswers({ groupComposition: 'couple' }),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('applies all filters together', () => {
      const wineries = [
        makeWinery({ id: 'a', minFlightPrice: 30, region: 'Russian River Valley' }),
        makeWinery({
          id: 'b',
          houseSpecialty: ['Zinfandel'],
          minFlightPrice: 30,
          region: 'Russian River Valley',
        }),
        makeWinery({ id: 'c', minFlightPrice: 80, region: 'Russian River Valley' }),
        makeWinery({ id: 'd', minFlightPrice: 30, region: 'Dry Creek Valley' }),
      ];
      const answers = makeAnswers({
        skipVarietals: ['Zinfandel'],
        budgetBand: '$$',
        preferredRegions: ['Russian River Valley'],
      });
      const result = applyHardFilters(wineries, answers);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });
  });
});
