-- Enum types used across the schema.
-- Values are derived from actual CSV data with mappings documented inline.

-- CSV values: required, recommended, walk-in-friendly, members-only
-- "members-only" is handled by a separate boolean on wineries; not an enum value.
create type reservation_type as enum (
  'walk_ins_welcome',        -- CSV: walk-in-friendly
  'reservations_recommended', -- CSV: recommended
  'appointment_only'          -- CSV: required
);

create type noise_level as enum (
  'quiet',
  'moderate',
  'lively'
);

-- CSV flight_type values: seated, bar, tour
-- Additional formats from PRD for future use: standing, outdoor, picnic
create type flight_format as enum (
  'seated',
  'standing',
  'tour',
  'outdoor',
  'picnic',
  'bar'
);

-- CSV ava_primary values: alexander-valley, carneros, dry-creek-valley,
-- green-valley, petaluma-gap, rockpile, russian-river-valley,
-- sonoma-coast, sonoma-mountain, sonoma-valley
create type ava_region as enum (
  'russian_river_valley',
  'dry_creek_valley',
  'alexander_valley',
  'sonoma_valley',
  'carneros',
  'sonoma_coast',
  'sonoma_mountain',
  'green_valley',
  'petaluma_gap',
  'rockpile'
);

create type winery_setting as enum (
  'vineyard',
  'estate',
  'downtown',
  'hilltop',
  'cave'
);

create type check_type as enum (
  'url_health',
  'hours_drift',
  'rating_drift',
  'missing_data',
  'user_report'
);

create type check_status as enum (
  'open',
  'resolved',
  'ignored'
);
