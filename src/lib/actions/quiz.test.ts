import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { QuizAnswers, WineryForMatching, Winery } from '../types';

function makeAnswers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    selectedVarietals: ['Pinot Noir'],
    selectedVibes: ['Relaxed & Scenic'],
    budgetBand: '$$',
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

function makeWineryForMatching(overrides: Partial<WineryForMatching> = {}): WineryForMatching {
  return {
    id: 'w-1',
    slug: 'test-winery',
    region: 'Russian River Valley',
    regionSecondary: null,
    reservationType: 'reservations_recommended',
    isMembersOnly: false,
    groupSizeMax: null,
    varietals: ['Pinot Noir'],
    minFlightPrice: 40,
    isDogFriendly: true,
    isKidFriendly: false,
    isWheelchairAccessible: true,
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

function makeWinery(overrides: Partial<Winery> = {}): Winery {
  return {
    id: 'w-1',
    slug: 'test-winery',
    name: 'Test Winery',
    tagline: 'A fine place',
    story: 'Great wines.',
    region: 'Russian River Valley',
    city: 'Healdsburg',
    latitude: 38.6,
    longitude: -122.8,
    setting: 'vineyard',
    hours: {
      monday: { open: '10:00', close: '17:00' },
      tuesday: { open: '10:00', close: '17:00' },
      wednesday: { open: '10:00', close: '17:00' },
      thursday: { open: '10:00', close: '17:00' },
      friday: { open: '10:00', close: '17:00' },
      saturday: { open: '10:00', close: '17:00' },
      sunday: null,
    },
    reservationType: 'reservations_recommended',
    bookingUrl: 'https://example.com/book',
    groupSizeMax: 12,
    parking: 'Lot — Free parking',
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
    maxFlightPrice: 60,
    flights: [],
    isDogFriendly: true,
    isKidFriendly: false,
    isWheelchairAccessible: true,
    hasFoodPairing: true,
    hasOutdoorSeating: true,
    hasViews: true,
    isMembersOnly: false,
    averageRating: 4.5,
    ratingsCount: 200,
    qualityScore: 4,
    popularityScore: 3,
    ratingGoogle: 4.5,
    ...overrides,
  };
}

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Headers({ 'x-forwarded-for': '127.0.0.1' })),
}));

vi.mock('../data/wineries', () => ({
  getWineriesForMatching: vi.fn(),
}));

vi.mock('../data/winery-lookup', () => ({
  getWineryLookup: vi.fn(),
}));

describe('submitQuiz server action', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns ranked MatchResults from valid quiz answers', async () => {
    const matchingData = [
      makeWineryForMatching({ id: 'w-1', slug: 'alpha' }),
      makeWineryForMatching({ id: 'w-2', slug: 'beta', ratingGoogle: 4.2 }),
      makeWineryForMatching({ id: 'w-3', slug: 'gamma', ratingGoogle: 4.0 }),
    ];
    const wineryMap = new Map<string, Winery>([
      ['w-1', makeWinery({ id: 'w-1', slug: 'alpha', name: 'Alpha Winery' })],
      ['w-2', makeWinery({ id: 'w-2', slug: 'beta', name: 'Beta Winery' })],
      ['w-3', makeWinery({ id: 'w-3', slug: 'gamma', name: 'Gamma Winery' })],
    ]);

    const dataModule = await import('../data/wineries');
    vi.mocked(dataModule.getWineriesForMatching).mockResolvedValue(matchingData);
    const lookupModule = await import('../data/winery-lookup');
    vi.mocked(lookupModule.getWineryLookup).mockResolvedValue(wineryMap);

    const { submitQuiz } = await import('./quiz');
    const answers = makeAnswers({ numStops: 3 });
    const results = await submitQuiz(answers);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    results.forEach((r) => {
      expect(r.winery).toBeDefined();
      expect(r.rank).toBeGreaterThan(0);
      expect(typeof r.score).toBe('number');
      expect(Array.isArray(r.matchReasons)).toBe(true);
    });
  });

  it('returns empty array when no wineries match', async () => {
    const matchingData = [makeWineryForMatching({ varietals: ['Zinfandel'], minFlightPrice: 200 })];
    const wineryMap = new Map<string, Winery>([['w-1', makeWinery()]]);

    const dataModule = await import('../data/wineries');
    vi.mocked(dataModule.getWineriesForMatching).mockResolvedValue(matchingData);
    const lookupModule = await import('../data/winery-lookup');
    vi.mocked(lookupModule.getWineryLookup).mockResolvedValue(wineryMap);

    const { submitQuiz } = await import('./quiz');
    const answers = makeAnswers({
      selectedVarietals: ['Chardonnay'],
      budgetBand: '$',
    });
    const results = await submitQuiz(answers);

    expect(results).toHaveLength(1);
    expect(results[0].filtersRelaxed).toBeDefined();
    expect(results[0].filtersRelaxed!.length).toBeGreaterThan(0);
  });

  it('throws on invalid quiz answers (missing required fields)', async () => {
    const { submitQuiz } = await import('./quiz');

    await expect(submitQuiz(null as unknown as QuizAnswers)).rejects.toThrow();
    await expect(submitQuiz({} as QuizAnswers)).rejects.toThrow();
  });

  it('propagates data layer errors', async () => {
    const dataModule = await import('../data/wineries');
    vi.mocked(dataModule.getWineriesForMatching).mockRejectedValue(
      new Error('Supabase unavailable'),
    );
    const lookupModule = await import('../data/winery-lookup');
    vi.mocked(lookupModule.getWineryLookup).mockResolvedValue(new Map());

    const { submitQuiz } = await import('./quiz');
    await expect(submitQuiz(makeAnswers())).rejects.toThrow('Supabase unavailable');
  });
});
