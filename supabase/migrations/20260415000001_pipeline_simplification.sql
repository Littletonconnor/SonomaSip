-- Pipeline simplification: discovery writes directly to `wineries`.
--
-- Drops the `winery_registry` shadow table, relaxes NOT NULL constraints on
-- editorial columns that OSM can't populate at discovery time, and adds
-- `osm_type` / `osm_id` columns so discovery upserts are idempotent.

-- 1. Drop winery_registry (shadow table for OSM discoveries — no longer used).

drop trigger if exists trg_winery_registry_updated_at on winery_registry;
drop index if exists idx_winery_registry_normalized_name;
drop index if exists idx_winery_registry_matched;
drop index if exists idx_winery_registry_source;
drop table if exists winery_registry;

-- 2. Relax NOT NULL on editorial columns OSM discovery can't supply.
-- Admin UI assigns these post-discovery.

alter table wineries
  alter column ava_primary drop not null,
  alter column reservation_type drop not null;

-- 3. Add OSM identity columns for idempotent upserts.
-- Populated by `scripts/discover-osm.ts`. Existing 68 editorial rows have
-- null OSM identifiers — the partial unique index below only constrains
-- rows where both are present.

alter table wineries
  add column osm_type text,
  add column osm_id bigint;

create unique index uidx_wineries_osm_identity
  on wineries (osm_type, osm_id)
  where osm_type is not null and osm_id is not null;

-- 4. Flip the `data_source` default so new discoveries don't inherit the
-- editorial tag. Existing rows keep `editorial_excel`; discovery sets
-- `osm_auto` explicitly.

alter table wineries
  alter column data_source drop default;
