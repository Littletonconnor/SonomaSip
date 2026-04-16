import { describe, expect, it } from 'vitest';
import type { Tables } from '../database.types';
import { buildDrafts, MIN_DRAFT_CONFIDENCE } from './diff';
import type { ExtractedFields } from './extract';

type WineryRow = Tables<'wineries'>;

function makeRow(overrides: Partial<WineryRow> = {}): WineryRow {
  return {
    accessibility_notes: null,
    address_city: null,
    address_street: null,
    address_zip: null,
    annual_cases: null,
    ava_primary: 'russian_river_valley',
    ava_secondary: null,
    awards: null,
    best_for: null,
    content_status: 'published',
    coverage_tier: 'editorial',
    created_at: '2026-01-01T00:00:00Z',
    data_source: null,
    data_sources: [],
    description: null,
    dog_notes: null,
    good_for_mix_grand: false,
    good_for_mix_intimate: false,
    has_barrel_tasting: false,
    has_bike_parking: false,
    has_blending_session: false,
    has_cave_tour: false,
    has_food_pairing: false,
    has_live_music: false,
    has_outdoor_seating: false,
    has_picnic_area: false,
    has_restaurant: false,
    has_sunset_views: false,
    has_vineyard_walk: false,
    hours: {},
    id: 'test-winery',
    is_active: true,
    is_bike_friendly: false,
    is_dog_friendly: false,
    is_hidden_gem: false,
    is_kid_friendly: false,
    is_local_favorite: false,
    is_members_only: false,
    is_must_visit: false,
    is_rideshare_friendly: false,
    is_wheelchair_accessible: false,
    kid_activities: null,
    large_group_friendly: false,
    last_places_sync_at: null,
    last_scraped_at: null,
    last_seating_offset: null,
    last_verified_at: null,
    latitude: 38.5,
    live_music_schedule: null,
    longitude: -122.8,
    max_group_size: null,
    name: 'Test Winery',
    nearby_wineries: null,
    nearest_town: null,
    noise_level: null,
    not_ideal_for: null,
    osm_id: null,
    osm_type: null,
    ownership_type: null,
    pairs_well_with: null,
    parking_notes: null,
    parking_type: null,
    phone: null,
    popularity_score: null,
    private_tasting_available: false,
    production_size: null,
    quality_score: null,
    rating_google: null,
    rating_tripadvisor: null,
    rating_yelp: null,
    reservation_type: 'walk_ins_welcome',
    reservation_url: null,
    review_count_total: null,
    setting: null,
    signature_wines: null,
    slug: 'test-winery',
    style_adventure: null,
    style_classic: null,
    style_family_friendly: null,
    style_luxury: null,
    style_social: null,
    style_sustainable: null,
    tagline: null,
    tasting_duration_typical: null,
    tasting_room_vibe: null,
    unique_selling_point: null,
    updated_at: '2026-01-01T00:00:00Z',
    verification_notes: null,
    vibe: null,
    walk_in_likelihood: null,
    walkable_from: null,
    website_url: null,
    winery_scale: null,
    ...overrides,
  };
}

describe('buildDrafts', () => {
  it('returns a proposal for a missing string field', () => {
    const extracted: ExtractedFields = {
      phone: {
        value: '(707) 555-0101',
        confidence: 0.95,
        source_quote: 'Call us at (707) 555-0101',
      },
    };
    const drafts = buildDrafts(extracted, makeRow());

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      field_name: 'phone',
      current_value: null,
      proposed_value: '(707) 555-0101',
      confidence: 0.95,
    });
  });

  it('skips fields where the extracted value matches the current DB value', () => {
    const extracted: ExtractedFields = {
      phone: { value: '(707) 555-0101', confidence: 0.95, source_quote: null },
      address_city: { value: 'Healdsburg', confidence: 0.9, source_quote: null },
    };
    const drafts = buildDrafts(
      extracted,
      makeRow({ phone: '7075550101', address_city: 'Healdsburg' }),
    );
    expect(drafts).toHaveLength(0);
  });

  it('normalizes string comparisons so whitespace and case differences are ignored', () => {
    const extracted: ExtractedFields = {
      address_city: { value: '  healdsburg  ', confidence: 0.9, source_quote: null },
    };
    const drafts = buildDrafts(extracted, makeRow({ address_city: 'Healdsburg' }));
    expect(drafts).toHaveLength(0);
  });

  it('normalizes URLs by stripping trailing slashes and case', () => {
    const extracted: ExtractedFields = {
      reservation_url: {
        value: 'https://example.com/book/',
        confidence: 0.9,
        source_quote: null,
      },
    };
    const drafts = buildDrafts(extracted, makeRow({ reservation_url: 'https://Example.com/book' }));
    expect(drafts).toHaveLength(0);
  });

  it('drops proposals below the minimum confidence threshold', () => {
    const extracted: ExtractedFields = {
      phone: {
        value: '(707) 555-0101',
        confidence: MIN_DRAFT_CONFIDENCE - 0.05,
        source_quote: null,
      },
    };
    const drafts = buildDrafts(extracted, makeRow());
    expect(drafts).toHaveLength(0);
  });

  it('drops fields with null values even if confidence is high', () => {
    const extracted: ExtractedFields = {
      phone: { value: null, confidence: 1, source_quote: null },
    };
    const drafts = buildDrafts(extracted, makeRow());
    expect(drafts).toHaveLength(0);
  });

  it('serializes boolean fields as "true"/"false" strings', () => {
    const extracted: ExtractedFields = {
      is_dog_friendly: { value: true, confidence: 1, source_quote: 'Dogs welcome on the patio.' },
    };
    const drafts = buildDrafts(extracted, makeRow({ is_dog_friendly: false }));

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      field_name: 'is_dog_friendly',
      current_value: 'false',
      proposed_value: 'true',
    });
  });

  it('serializes numeric fields and detects changes', () => {
    const extracted: ExtractedFields = {
      max_group_size: { value: 8, confidence: 0.9, source_quote: null },
    };
    const drafts = buildDrafts(extracted, makeRow({ max_group_size: 6 }));

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      field_name: 'max_group_size',
      current_value: '6',
      proposed_value: '8',
    });
  });

  it('treats hours as changed when day-level values differ', () => {
    const extracted: ExtractedFields = {
      hours: {
        value: {
          monday: null,
          tuesday: { open: '10:00', close: '17:00' },
          wednesday: { open: '10:00', close: '17:00' },
          thursday: { open: '10:00', close: '17:00' },
          friday: { open: '10:00', close: '17:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: '11:00', close: '17:00' },
        },
        confidence: 0.95,
        source_quote: null,
      },
    };
    const drafts = buildDrafts(extracted, makeRow({ hours: {} }));

    expect(drafts).toHaveLength(1);
    const parsed = JSON.parse(drafts[0].proposed_value);
    expect(parsed.tuesday).toEqual({ open: '10:00', close: '17:00' });
    expect(parsed.monday).toBeNull();
  });

  it('treats identical hours (different key order) as equal', () => {
    const extracted: ExtractedFields = {
      hours: {
        value: {
          sunday: { open: '11:00', close: '17:00' },
          saturday: { open: '10:00', close: '18:00' },
        },
        confidence: 0.9,
        source_quote: null,
      },
    };
    const currentHours = {
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '11:00', close: '17:00' },
    };
    const drafts = buildDrafts(extracted, makeRow({ hours: currentHours }));
    expect(drafts).toHaveLength(0);
  });

  it('only proposes the reservation type when it differs from the DB value', () => {
    const extracted: ExtractedFields = {
      reservation_type: {
        value: 'reservations_recommended',
        confidence: 1,
        source_quote: 'Reservations recommended.',
      },
    };
    const drafts = buildDrafts(extracted, makeRow({ reservation_type: 'walk_ins_welcome' }));

    expect(drafts).toHaveLength(1);
    expect(drafts[0].proposed_value).toBe('reservations_recommended');
    expect(drafts[0].current_value).toBe('walk_ins_welcome');
  });

  it('rounds confidence to two decimal places for storage', () => {
    const extracted: ExtractedFields = {
      phone: { value: '(707) 555-0101', confidence: 0.9234, source_quote: null },
    };
    const [draft] = buildDrafts(extracted, makeRow());
    expect(draft.confidence).toBe(0.92);
  });
});
