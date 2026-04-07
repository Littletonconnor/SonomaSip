-- Pipeline infrastructure: tables for the automated winery data pipeline.
-- Stages: discovery → crawl → extract → enrich → review → publish → monitor.

-- Enums for pipeline stages and statuses.

create type pipeline_stage as enum (
  'discovery',
  'crawl',
  'extraction',
  'enrichment',
  'publish',
  'health_check'
);

create type pipeline_run_status as enum (
  'running',
  'completed',
  'failed',
  'partial'
);

create type coverage_tier as enum (
  'editorial',
  'verified',
  'discovered'
);

create type content_draft_status as enum (
  'pending',
  'approved',
  'rejected',
  'auto_approved'
);

create type content_status as enum (
  'draft',
  'review',
  'published'
);

-- Pipeline run audit trail. Every stage execution gets a row.

create table pipeline_runs (
  id bigint generated always as identity primary key,
  stage pipeline_stage not null,
  status pipeline_run_status not null default 'running',
  wineries_processed integer not null default 0,
  wineries_failed integer not null default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index idx_pipeline_runs_stage on pipeline_runs (stage);
create index idx_pipeline_runs_status on pipeline_runs (status) where status = 'running';

-- Canonical winery registry from all discovery sources.
-- One row per winery per source; dedup logic lives in application code.

create table winery_registry (
  id bigint generated always as identity primary key,
  name text not null,
  normalized_name text not null,
  source text not null,
  source_id text,
  website_url text,
  latitude double precision,
  longitude double precision,
  matched_winery_id text references wineries (id) on delete set null,
  coverage_tier coverage_tier not null default 'discovered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (source, source_id)
);

create index idx_winery_registry_normalized_name on winery_registry (normalized_name);
create index idx_winery_registry_matched on winery_registry (matched_winery_id) where matched_winery_id is not null;
create index idx_winery_registry_source on winery_registry (source);

create trigger trg_winery_registry_updated_at
  before update on winery_registry
  for each row execute function update_updated_at();

-- Raw crawl output. One row per page per crawl run.

create table winery_scrapes (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  run_id bigint not null references pipeline_runs (id) on delete cascade,
  page_url text not null,
  page_title text,
  raw_markdown text not null,
  word_count integer,
  scraped_at timestamptz not null default now()
);

create index idx_winery_scrapes_winery on winery_scrapes (winery_id);
create index idx_winery_scrapes_run on winery_scrapes (run_id);

-- LLM-extracted structured data with confidence scores per field.

create table winery_extractions (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  run_id bigint not null references pipeline_runs (id) on delete cascade,
  extracted_fields jsonb not null default '{}'::jsonb,
  model_used text not null,
  token_count integer,
  extracted_at timestamptz not null default now()
);

create index idx_winery_extractions_winery on winery_extractions (winery_id);
create index idx_winery_extractions_run on winery_extractions (run_id);

-- Proposed changes awaiting review. One row per field per change.

create table content_drafts (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  extraction_id bigint references winery_extractions (id) on delete set null,
  field_name text not null,
  current_value text,
  proposed_value text not null,
  confidence numeric(3,2),
  source_quote text,
  status content_draft_status not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_content_drafts_winery on content_drafts (winery_id);
create index idx_content_drafts_status on content_drafts (status) where status = 'pending';

-- URL health monitoring. One row per check per URL.

create table url_health_checks (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  url text not null,
  status_code integer,
  redirect_url text,
  response_time_ms integer,
  checked_at timestamptz not null default now()
);

create index idx_url_health_checks_winery on url_health_checks (winery_id);
create index idx_url_health_checks_recent on url_health_checks (checked_at desc);

-- Point-in-time snapshots of winery rows before pipeline overwrites.
-- Enables rollback to any previous state per winery.

create table winery_snapshots (
  id bigint generated always as identity primary key,
  winery_id text not null references wineries (id) on delete cascade,
  run_id bigint not null references pipeline_runs (id) on delete cascade,
  snapshot jsonb not null,
  reason text not null default 'pipeline_publish',
  created_at timestamptz not null default now()
);

create index idx_winery_snapshots_winery on winery_snapshots (winery_id);
create index idx_winery_snapshots_run on winery_snapshots (run_id);
create index idx_winery_snapshots_recent on winery_snapshots (winery_id, created_at desc);

-- Add pipeline columns to the wineries table.

alter table wineries
  add column coverage_tier coverage_tier not null default 'editorial',
  add column last_scraped_at timestamptz,
  add column content_status content_status not null default 'published',
  add column data_sources jsonb not null default '[]'::jsonb;

create index idx_wineries_coverage_tier on wineries (coverage_tier);

-- RLS: all pipeline tables are service-role only (no anon/authenticated policies).

alter table pipeline_runs enable row level security;
alter table winery_registry enable row level security;
alter table winery_scrapes enable row level security;
alter table winery_extractions enable row level security;
alter table content_drafts enable row level security;
alter table url_health_checks enable row level security;
alter table winery_snapshots enable row level security;
