import { describe, it, expect, beforeAll } from 'vitest';
import type { Winery, WineryForMatching } from '../../types';
import { recommend } from '../index';
import { getWineriesForMatching } from '../../data/wineries';
import { getWineryLookup } from '../../data/winery-lookup';
import { allProfiles } from '../__fixtures__/quiz-profiles';

let wineries: WineryForMatching[];
let lookup: Map<string, Winery>;

beforeAll(async () => {
  wineries = await getWineriesForMatching();
  lookup = await getWineryLookup();
}, 15000);

describe('golden tests — real Supabase data', () => {
  it('database has sufficient winery data', () => {
    expect(wineries.length).toBeGreaterThanOrEqual(65);
    expect(lookup.size).toBeGreaterThanOrEqual(65);
  });

  describe.each(Object.entries(allProfiles))('%s', (name, answers) => {
    it('returns at least 1 result (no empty results)', () => {
      const results = recommend(wineries, answers, lookup);
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('returns at most numStops results', () => {
      const results = recommend(wineries, answers, lookup);
      expect(results.length).toBeLessThanOrEqual(answers.numStops);
    });

    it('scores are descending', () => {
      const results = recommend(wineries, answers, lookup);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });

    it('scores are in 0–100 range', () => {
      const results = recommend(wineries, answers, lookup);
      for (const r of results) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    });

    it('every result has match reasons', () => {
      const results = recommend(wineries, answers, lookup);
      for (const r of results) {
        expect(r.matchReasons.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('ranks are sequential starting at 1', () => {
      const results = recommend(wineries, answers, lookup);
      results.forEach((r, i) => {
        expect(r.rank).toBe(i + 1);
      });
    });

    it('slug ordering snapshot', () => {
      const results = recommend(wineries, answers, lookup);
      const snapshot = results.map((r) => ({
        rank: r.rank,
        slug: r.winery.slug,
        score: r.score,
        relaxed: r.filtersRelaxed ?? [],
      }));
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('profile-specific assertions', () => {
    it('wideOpen: results span ≥3 regions', () => {
      const results = recommend(wineries, allProfiles.wideOpen, lookup);
      const regions = new Set(results.map((r) => r.winery.region));
      expect(regions.size).toBeGreaterThanOrEqual(3);
    });

    it('veryRestrictive: uses filter relaxation', () => {
      const results = recommend(wineries, allProfiles.veryRestrictive, lookup);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const hasRelaxed = results.some((r) => r.filtersRelaxed && r.filtersRelaxed.length > 0);
      expect(hasRelaxed).toBe(true);
    });

    it('luxuryGroup: returns 4 results (numStops = 4)', () => {
      const results = recommend(wineries, allProfiles.luxuryGroup, lookup);
      expect(results.length).toBe(4);
    });

    it('allDefaults: returns results with no filters applied', () => {
      const results = recommend(wineries, allProfiles.allDefaults, lookup);
      expect(results.length).toBe(3);
      const hasRelaxed = results.some((r) => r.filtersRelaxed && r.filtersRelaxed.length > 0);
      expect(hasRelaxed).toBe(false);
    });
  });

  describe('determinism', () => {
    it('same input always produces same output', () => {
      const run1 = recommend(wineries, allProfiles.casualCouple, lookup);
      const run2 = recommend(wineries, allProfiles.casualCouple, lookup);
      expect(run1.map((r) => r.winery.slug)).toEqual(run2.map((r) => r.winery.slug));
      expect(run1.map((r) => r.score)).toEqual(run2.map((r) => r.score));
    });
  });
});
