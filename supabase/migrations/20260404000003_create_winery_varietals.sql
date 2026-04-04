-- Normalized varietal data from varietals.csv.
-- CSV has boolean columns per varietal (pinot_noir, chardonnay, cabernet_sauvignon, etc.)
-- plus other_varietals (free text) and signature_wines (free text).
-- We store each varietal as a row so we can filter/index efficiently.

create table winery_varietals (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  varietal text not null,          -- e.g. 'pinot_noir', 'chardonnay', 'cabernet_sauvignon'
  is_signature boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index idx_winery_varietals_unique
  on winery_varietals (winery_id, varietal);

create index idx_winery_varietals_varietal
  on winery_varietals (varietal);

-- RLS: public read-only
alter table winery_varietals enable row level security;

create policy "winery_varietals_public_select"
  on winery_varietals for select
  to anon, authenticated
  using (true);
