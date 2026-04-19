-- Rename `is_kid_friendly` to `kid_welcome` + flip default to true.
--
-- Quiz v1.0 (TODO §1) renames this field to match the "kids welcome vs
-- 21+ only" framing — most Sonoma tasting rooms welcome kids, so the
-- default flips to true. Rooms with 21+ policies get explicitly flagged
-- as false via the editorial backfill.
--
-- Existing 68 rows keep their current `false` values through the rename
-- — the backfill script (TODO §1) re-evaluates each winery. The default
-- flip only affects rows inserted after this migration lands.

alter table wineries
  rename column is_kid_friendly to kid_welcome;

alter table wineries
  alter column kid_welcome set default true;
