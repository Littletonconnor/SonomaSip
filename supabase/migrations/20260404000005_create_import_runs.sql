-- Tracks each data import run for auditability.

create table import_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_file_hash text,
  wineries_upserted integer not null default 0,
  flights_upserted integer not null default 0,
  varietals_upserted integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb
);

-- RLS: admin-only (service role). No public access.
alter table import_runs enable row level security;

-- No policies for anon/authenticated = no access.
-- Service role bypasses RLS.
