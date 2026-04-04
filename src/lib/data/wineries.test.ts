import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Tables } from '../database.types';

type WineryRow = Tables<'wineries'>;
type FlightRow = Tables<'flights'>;
type VarietalRow = Tables<'winery_varietals'>;

function makeWineryRow(overrides: Partial<WineryRow> = {}): WineryRow {
  return {
    id: 'winery-1',
    slug: 'test-winery',
    name: 'Test Winery',
    tagline: 'A fine place',
    description: 'Great wines.',
    ava_primary: 'russian_river_valley',
    ava_secondary: null,
    address_city: 'Healdsburg',
    address_street: '123 Vine Ln',
    address_zip: '95448',
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
    reservation_type: 'reservations_recommended',
    reservation_url: 'https://example.com/book',
    website_url: 'https://example.com',
    max_group_size: 12,
    parking_type: 'lot',
    parking_notes: 'Free parking',
    noise_level: 'moderate',
    phone: '707-555-1234',
    is_dog_friendly: true,
    is_kid_friendly: false,
    is_wheelchair_accessible: true,
    has_food_pairing: true,
    has_picnic_area: false,
    has_sunset_views: true,
    is_members_only: false,
    is_active: true,
    rating_google: 4.5,
    rating_yelp: null,
    rating_tripadvisor: null,
    review_count_total: 200,
    quality_score: 4,
    popularity_score: 3,
    style_classic: 4,
    style_luxury: 3,
    style_family_friendly: 2,
    style_social: 3,
    style_sustainable: 4,
    style_adventure: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    accessibility_notes: null,
    annual_cases: null,
    awards: null,
    best_for: null,
    data_source: null,
    dog_notes: null,
    good_for_mix_grand: false,
    good_for_mix_intimate: true,
    has_barrel_tasting: false,
    has_bike_parking: false,
    has_blending_session: false,
    has_cave_tour: false,
    has_live_music: false,
    has_restaurant: false,
    has_vineyard_walk: true,
    is_bike_friendly: false,
    is_hidden_gem: false,
    is_local_favorite: true,
    is_must_visit: false,
    is_rideshare_friendly: true,
    kid_activities: null,
    large_group_friendly: false,
    last_places_sync_at: null,
    last_seating_offset: null,
    last_verified_at: null,
    live_music_schedule: null,
    nearby_wineries: null,
    nearest_town: null,
    not_ideal_for: null,
    ownership_type: null,
    pairs_well_with: null,
    private_tasting_available: false,
    production_size: null,
    signature_wines: null,
    tasting_duration_typical: null,
    tasting_room_vibe: null,
    unique_selling_point: null,
    verification_notes: null,
    vibe: null,
    walk_in_likelihood: null,
    walkable_from: null,
    winery_scale: null,
    ...overrides,
  };
}

function makeFlightRow(overrides: Partial<FlightRow> = {}): FlightRow {
  return {
    id: 1,
    winery_id: 'winery-1',
    name: 'Classic Tasting',
    price: 40,
    duration_minutes: 60,
    wines_count: 5,
    format: 'seated',
    food_included: false,
    reservation_required: true,
    description: 'A classic tasting experience',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeVarietalRow(overrides: Partial<VarietalRow> = {}): VarietalRow {
  return {
    id: 1,
    winery_id: 'winery-1',
    varietal: 'pinot_noir',
    is_signature: true,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createChainableQuery(result: { data: unknown; error: unknown }) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result);
      }
      if (prop === 'single') {
        return () => Promise.resolve(result);
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

vi.mock('../supabase-server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('wineries data layer', () => {
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    mockFrom = vi.fn();
    const mod = await import('../supabase-server');
    vi.mocked(mod.createServerSupabase).mockReturnValue({ from: mockFrom } as never);
  });

  describe('getWineriesForMatching', () => {
    it('returns mapped WineryForMatching array from joined data', async () => {
      const wineryRow = makeWineryRow();
      const flightRow = makeFlightRow();
      const varietalRow = makeVarietalRow();

      mockFrom.mockReturnValue(
        createChainableQuery({
          data: [{ ...wineryRow, flights: [flightRow], winery_varietals: [varietalRow] }],
          error: null,
        }),
      );

      const { getWineriesForMatching } = await import('./wineries');
      const results = await getWineriesForMatching();

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('winery-1');
      expect(results[0].slug).toBe('test-winery');
      expect(results[0].region).toBe('Russian River Valley');
      expect(results[0].varietals).toContain('Pinot Noir');
      expect(results[0].styleScores.styleRelaxed).toBe(4);
      expect(results[0].minFlightPrice).toBe(40);
      expect(results[0].isDogFriendly).toBe(true);
    });

    it('filters out inactive wineries', async () => {
      mockFrom.mockReturnValue(
        createChainableQuery({
          data: [
            { ...makeWineryRow({ is_active: true }), flights: [], winery_varietals: [] },
            {
              ...makeWineryRow({ id: 'w-2', slug: 'inactive', is_active: false }),
              flights: [],
              winery_varietals: [],
            },
          ],
          error: null,
        }),
      );

      const { getWineriesForMatching } = await import('./wineries');
      const results = await getWineriesForMatching();

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('winery-1');
    });

    it('throws on supabase error', async () => {
      mockFrom.mockReturnValue(
        createChainableQuery({ data: null, error: { message: 'DB connection failed' } }),
      );

      const { getWineriesForMatching } = await import('./wineries');
      await expect(getWineriesForMatching()).rejects.toThrow('DB connection failed');
    });
  });

  describe('getWineryBySlug', () => {
    it('returns mapped WineryForDisplay for a valid slug', async () => {
      const wineryRow = makeWineryRow();
      const flightRow = makeFlightRow();
      const varietalRow = makeVarietalRow();

      mockFrom.mockReturnValue(
        createChainableQuery({
          data: { ...wineryRow, flights: [flightRow], winery_varietals: [varietalRow] },
          error: null,
        }),
      );

      const { getWineryBySlug } = await import('./wineries');
      const result = await getWineryBySlug('test-winery');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test Winery');
      expect(result!.slug).toBe('test-winery');
      expect(result!.flights).toHaveLength(1);
      expect(result!.flights[0].price).toBe(40);
      expect(result!.varietals).toContain('Pinot Noir');
    });

    it('returns null for non-existent slug', async () => {
      mockFrom.mockReturnValue(
        createChainableQuery({
          data: null,
          error: { code: 'PGRST116', message: 'not found' },
        }),
      );

      const { getWineryBySlug } = await import('./wineries');
      const result = await getWineryBySlug('does-not-exist');

      expect(result).toBeNull();
    });
  });

  describe('getAllWinerySlugs', () => {
    it('returns array of slug strings', async () => {
      mockFrom.mockReturnValue(
        createChainableQuery({
          data: [{ slug: 'winery-a' }, { slug: 'winery-b' }, { slug: 'winery-c' }],
          error: null,
        }),
      );

      const { getAllWinerySlugs } = await import('./wineries');
      const slugs = await getAllWinerySlugs();

      expect(slugs).toEqual(['winery-a', 'winery-b', 'winery-c']);
    });

    it('throws on supabase error', async () => {
      mockFrom.mockReturnValue(createChainableQuery({ data: null, error: { message: 'timeout' } }));

      const { getAllWinerySlugs } = await import('./wineries');
      await expect(getAllWinerySlugs()).rejects.toThrow('timeout');
    });
  });

  describe('getAllWineriesForBrowse', () => {
    it('returns mapped WineryForDisplay array', async () => {
      const wineryRow = makeWineryRow();
      const flightRow = makeFlightRow();
      const varietalRow = makeVarietalRow();

      mockFrom.mockReturnValue(
        createChainableQuery({
          data: [{ ...wineryRow, flights: [flightRow], winery_varietals: [varietalRow] }],
          error: null,
        }),
      );

      const { getAllWineriesForBrowse } = await import('./wineries');
      const results = await getAllWineriesForBrowse();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Winery');
      expect(results[0].region).toBe('Russian River Valley');
      expect(results[0].flights).toHaveLength(1);
    });

    it('filters out inactive wineries', async () => {
      mockFrom.mockReturnValue(
        createChainableQuery({
          data: [
            { ...makeWineryRow({ is_active: true }), flights: [], winery_varietals: [] },
            {
              ...makeWineryRow({ id: 'w-2', slug: 'inactive', is_active: false }),
              flights: [],
              winery_varietals: [],
            },
          ],
          error: null,
        }),
      );

      const { getAllWineriesForBrowse } = await import('./wineries');
      const results = await getAllWineriesForBrowse();

      expect(results).toHaveLength(1);
      expect(results.every((w) => w.slug !== 'inactive')).toBe(true);
    });
  });
});
