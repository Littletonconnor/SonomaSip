-- Data health checks track automated quality signals (URL liveness,
-- hours drift, rating changes, user reports).

create table data_health_checks (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  check_type check_type not null,
  status check_status not null default 'open',
  details jsonb,
  checked_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create index idx_data_health_checks_winery on data_health_checks (winery_id);
create index idx_data_health_checks_open on data_health_checks (status) where status = 'open';

-- Field overrides provide an audit trail for editorial corrections
-- that diverge from the import pipeline.
create table field_overrides (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  field_name text not null,
  override_value text,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_field_overrides_winery on field_overrides (winery_id);

-- RLS: admin-only (service role). No public access.
alter table data_health_checks enable row level security;
alter table field_overrides enable row level security;

-- No policies for anon/authenticated = no access.
-- Service role bypasses RLS.
