-- Add `house_specialty` to wineries for the Quiz v1.0 dealbreaker filter.
--
-- A *curated* list of 1–3 varietals this winery is known for — distinct from
-- `winery_varietals`, which lists every varietal they pour. The dealbreaker
-- filter matches against this column only; matching against
-- `winery_varietals` would exclude nearly every Sonoma winery when a user
-- skips Zinfandel.
--
-- Values use the same lowercase-underscore convention as
-- `winery_varietals.varietal` (e.g. 'pinot_noir', 'zinfandel'). Enforcement
-- of valid values + the 1–3 cap lives in the admin UI and the TS `Varietal`
-- union, not the DB — consistent with existing `winery_varietals` storage.

alter table wineries
  add column house_specialty text[] not null default '{}';
