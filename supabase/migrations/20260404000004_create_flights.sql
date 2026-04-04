-- Flights from flights-and-pricing.csv.
-- Multiple flights per winery (118 rows for 68 wineries).

create table flights (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  name text not null,                          -- CSV: flight_name
  price numeric(6,2),                          -- CSV: flight_price
  wines_count smallint,                        -- CSV: flight_wines_count
  duration_minutes smallint,                   -- CSV: flight_duration
  format flight_format,                        -- CSV: flight_type (mapped to enum)
  food_included boolean not null default false, -- CSV: flight_food_included
  reservation_required boolean not null default false, -- CSV: flight_reservation_required
  description text,                            -- CSV: flight_description
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_flights_winery_id on flights (winery_id);
create index idx_flights_price on flights (price) where price is not null;

create trigger trg_flights_updated_at
  before update on flights
  for each row execute function update_updated_at();

-- RLS: public read-only
alter table flights enable row level security;

create policy "flights_public_select"
  on flights for select
  to anon, authenticated
  using (true);
