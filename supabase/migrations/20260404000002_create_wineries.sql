create table wineries (
  id text primary key,                         -- CSV: id (slug, e.g. "jordan-winery")
  slug text not null unique,                   -- same as id for now; kept separate for future flexibility
  name text not null,                          -- CSV: name
  description text,                            -- CSV: description (editorial story)
  tagline text,                                -- CSV: tagline
  website_url text,                            -- CSV: website
  phone text,                                  -- CSV: phone
  address_street text,                         -- CSV: address_street
  address_city text,                           -- CSV: address_city
  address_zip text,                            -- CSV: address_zip
  latitude double precision not null,          -- CSV: latitude
  longitude double precision not null,         -- CSV: longitude
  ava_primary ava_region not null,             -- CSV: ava_primary (mapped from slug to enum)
  ava_secondary ava_region,                    -- CSV: ava_secondary
  nearest_town text,                           -- CSV: nearest_town
  production_size text,                        -- CSV: production_size (small, medium, large)
  annual_cases integer,                        -- CSV: annual_cases
  winery_scale text,                           -- CSV: winery_scale (boutique, intimate, established, grand)
  tasting_room_vibe text,                      -- CSV: tasting_room_vibe (free-text: elegant, rustic, modern, etc.)
  ownership_type text,                         -- CSV: ownership_type (family-owned, corporate)

  -- Tasting & hours (from tasting-and-hours.csv)
  reservation_type reservation_type not null,  -- CSV: reservation_required (mapped)
  reservation_url text,                        -- CSV: reservation_url
  walk_in_likelihood text,                     -- CSV: walk_in_likelihood (low, medium, high)
  hours jsonb not null default '{}'::jsonb,    -- CSV: hours_mon..hours_sun stored as {"mon":"10:00-17:00",...}
  tasting_duration_typical integer,            -- CSV: tasting_duration_typical (minutes)
  last_seating_offset integer,                 -- CSV: last_seating_offset (minutes before close)
  is_members_only boolean not null default false, -- derived from reservation_required = 'members-only'

  -- Style scores (from style-scores.csv, 1-5 scale)
  style_classic smallint check (style_classic between 1 and 5),
  style_luxury smallint check (style_luxury between 1 and 5),
  style_family_friendly smallint check (style_family_friendly between 1 and 5),
  style_social smallint check (style_social between 1 and 5),
  style_sustainable smallint check (style_sustainable between 1 and 5),
  style_adventure smallint check (style_adventure between 1 and 5),
  vibe text,                                   -- CSV: vibe (free-text, e.g. "elegant, refined")
  noise_level noise_level,                     -- CSV: noise_level
  best_for text,                               -- CSV: best_for
  not_ideal_for text,                          -- CSV: not_ideal_for

  -- Experiences (from experiences.csv, boolean flags)
  has_cave_tour boolean not null default false,
  has_vineyard_walk boolean not null default false,
  has_food_pairing boolean not null default false,
  has_barrel_tasting boolean not null default false,
  has_blending_session boolean not null default false,
  has_picnic_area boolean not null default false,
  has_restaurant boolean not null default false,
  has_sunset_views boolean not null default false,
  has_live_music boolean not null default false,
  live_music_schedule text,                    -- CSV: live_music_schedule
  is_dog_friendly boolean not null default false,
  dog_notes text,                              -- CSV: dog_notes
  is_kid_friendly boolean not null default false,
  kid_activities text,                         -- CSV: kid_activities
  is_wheelchair_accessible boolean not null default false,
  accessibility_notes text,                    -- CSV: accessibility_notes

  -- Logistics (from logistics.csv)
  max_group_size smallint,                     -- CSV: max_group_size
  large_group_friendly boolean not null default false,
  private_tasting_available boolean not null default false,
  is_bike_friendly boolean not null default false,
  has_bike_parking boolean not null default false,
  is_rideshare_friendly boolean not null default false,
  walkable_from text,                          -- CSV: walkable_from
  parking_type text,                           -- CSV: parking_type
  parking_notes text,                          -- CSV: parking_notes
  nearby_wineries text,                        -- CSV: nearby_wineries (comma-separated slugs)
  pairs_well_with text,                        -- CSV: pairs_well_with (comma-separated slugs)

  -- Ratings (from ratings.csv)
  rating_google numeric(2,1),                  -- CSV: rating_google (e.g. 4.8)
  rating_yelp numeric(2,1),                    -- CSV: rating_yelp
  rating_tripadvisor numeric(2,1),             -- CSV: rating_tripadvisor
  review_count_total integer,                  -- CSV: review_count_total
  quality_score smallint check (quality_score between 1 and 10),  -- CSV: quality_score (editorial, 1-10)
  popularity_score smallint check (popularity_score between 1 and 10), -- CSV: popularity_score (editorial, 1-10)
  is_hidden_gem boolean not null default false, -- CSV: hidden_gem
  is_must_visit boolean not null default false,  -- CSV: must_visit
  is_local_favorite boolean not null default false, -- CSV: local_favorite
  unique_selling_point text,                   -- CSV: unique_selling_point
  awards text,                                 -- CSV: awards
  good_for_mix_intimate boolean not null default false, -- CSV: good_for_mix_intimate
  good_for_mix_grand boolean not null default false,    -- CSV: good_for_mix_grand

  -- Provenance / admin
  setting winery_setting,                      -- derived during import from tasting_room_vibe/context
  signature_wines text,                        -- CSV: signature_wines (from varietals.csv)
  is_active boolean not null default true,
  data_source text default 'editorial_excel',
  last_verified_at timestamptz,
  last_places_sync_at timestamptz,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wineries_ava_primary on wineries (ava_primary);
create index idx_wineries_reservation_type on wineries (reservation_type);
create index idx_wineries_is_active on wineries (is_active) where is_active = true;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_wineries_updated_at
  before update on wineries
  for each row execute function update_updated_at();

-- RLS: public read-only
alter table wineries enable row level security;

create policy "wineries_public_select"
  on wineries for select
  to anon, authenticated
  using (true);
