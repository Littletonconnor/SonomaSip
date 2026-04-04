-- Shared itineraries store a snapshot of quiz answers + results.
-- The results JSONB contains full winery+flight data (not just IDs)
-- so the shared plan survives data re-imports.

create table shared_itineraries (
  id uuid primary key default gen_random_uuid(),
  quiz_answers jsonb not null,
  results jsonb not null,                      -- full winery+flight snapshot array
  payload_version smallint not null default 1, -- for future schema evolution
  created_at timestamptz not null default now()
);

create index idx_shared_itineraries_created_at on shared_itineraries (created_at);

-- RLS: server-only INSERT, public SELECT by id
alter table shared_itineraries enable row level security;

create policy "shared_itineraries_public_select"
  on shared_itineraries for select
  to anon, authenticated
  using (true);

-- INSERT is only allowed via service role (bypasses RLS).
-- No INSERT policy for anon/authenticated.
