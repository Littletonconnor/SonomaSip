import { describe, expect, it } from 'vitest';
import type { QuizAnswers, WineryForMatching } from '../types';
import { applyHardFilters, getBudgetCeiling } from './filters';

function makeWinery(overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id: 'test-winery',
    slug: 'test-winery',
    region: 'Russian River Valley',
    regionSecondary: null,
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

  describe('varietal filter', () => {
    it('keeps wineries with matching varietal', () => {
      const result = applyHardFilters(
        [makeWinery({ varietals: ['Pinot Noir'] })],
        makeAnswers({ selectedVarietals: ['Pinot Noir'] }),
      );
      expect(result).toHaveLength(1);
    });

    it('removes wineries with no matching varietal', () => {
      const result = applyHardFilters(
        [makeWinery({ varietals: ['Zinfandel'] })],
        makeAnswers({ selectedVarietals: ['Pinot Noir'] }),
      );
      expect(result).toHaveLength(0);
    });

    it('uses OR logic — any match passes', () => {
      const result = applyHardFilters(
        [makeWinery({ varietals: ['Zinfandel', 'Merlot'] })],
        makeAnswers({ selectedVarietals: ['Pinot Noir', 'Merlot'] }),
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

  describe('members-only filter', () => {
    it('excludes members-only wineries by default', () => {
      const result = applyHardFilters([makeWinery({ isMembersOnly: true })], makeAnswers());
      expect(result).toHaveLength(0);
    });

    it('includes members-only wineries when opted in', () => {
      const result = applyHardFilters(
        [makeWinery({ isMembersOnly: true })],
        makeAnswers({ includeMembersOnly: true }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('must-have filters', () => {
    it('removes wineries missing required must-haves', () => {
      const result = applyHardFilters(
        [makeWinery({ isWheelchairAccessible: false })],
        makeAnswers({
          mustHaves: {
            views: false,
            foodPairing: false,
            outdoorSeating: false,
            dogFriendly: false,
            kidFriendly: false,
            wheelchairAccessible: true,
          },
        }),
      );
      expect(result).toHaveLength(0);
    });

    it('keeps wineries that have all required must-haves', () => {
      const result = applyHardFilters(
        [makeWinery({ hasViews: true, hasFoodPairing: true })],
        makeAnswers({
          mustHaves: {
            views: true,
            foodPairing: true,
            outdoorSeating: false,
            dogFriendly: false,
            kidFriendly: false,
            wheelchairAccessible: false,
          },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('group size filter', () => {
    it('excludes wineries with low groupSizeMax when group is 8+', () => {
      const result = applyHardFilters(
        [makeWinery({ groupSizeMax: 6 })],
        makeAnswers({ groupSize: 8 }),
      );
      expect(result).toHaveLength(0);
    });

    it('passes wineries with null groupSizeMax (no limit)', () => {
      const result = applyHardFilters(
        [makeWinery({ groupSizeMax: null })],
        makeAnswers({ groupSize: 10 }),
      );
      expect(result).toHaveLength(1);
    });

    it('does not filter when group < 8', () => {
      const result = applyHardFilters(
        [makeWinery({ groupSizeMax: 4 })],
        makeAnswers({ groupSize: 6 }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('combined filters', () => {
    it('applies all filters together', () => {
      const wineries = [
        makeWinery({
          id: 'a',
          varietals: ['Pinot Noir'],
          minFlightPrice: 30,
          region: 'Russian River Valley',
        }),
        makeWinery({
          id: 'b',
          varietals: ['Zinfandel'],
          minFlightPrice: 30,
          region: 'Russian River Valley',
        }),
        makeWinery({
          id: 'c',
          varietals: ['Pinot Noir'],
          minFlightPrice: 80,
          region: 'Russian River Valley',
        }),
        makeWinery({
          id: 'd',
          varietals: ['Pinot Noir'],
          minFlightPrice: 30,
          region: 'Dry Creek Valley',
        }),
      ];
      const answers = makeAnswers({
        selectedVarietals: ['Pinot Noir'],
        budgetBand: '$$',
        preferredRegions: ['Russian River Valley'],
      });
      const result = applyHardFilters(wineries, answers);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });
  });
});
