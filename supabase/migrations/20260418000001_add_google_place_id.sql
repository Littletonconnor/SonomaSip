-- Add `google_place_id` to wineries for the future Places sync stage.
--
-- The stage (scripts/places-sync.ts, not yet built) will:
--   1. Resolve place_id via Places findPlaceFromText using name + address_city
--      and cache it here so we only pay for the lookup once per winery.
--   2. Use the cached place_id to fetch Place Details on each refresh
--      (rating + user_ratings_total), writing directly to
--      rating_google / review_count_total. Google is authoritative — no
--      draft staging needed.
--
-- Nullable because existing rows haven't been resolved yet; unique so we
-- never double-link two wineries to the same Google listing.

alter table wineries
  add column google_place_id text;

create unique index uidx_wineries_google_place_id
  on wineries (google_place_id)
  where google_place_id is not null;
