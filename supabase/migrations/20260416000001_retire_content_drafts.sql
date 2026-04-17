-- Retire `content_drafts` + Claude extraction pipeline.
--
-- The simplified pipeline is: discover → crawl → admin manually enters fields.
-- No per-field proposal stream means no need for a staging table.
-- Places ratings (future) will write directly to wineries without a draft.
--
-- Also flip the wineries.content_status default so future ingestion paths
-- inherit the safe default (drafts are invisible until admin publishes).

drop index if exists idx_content_drafts_winery;
drop index if exists idx_content_drafts_status;
drop table if exists content_drafts;
drop type if exists content_draft_status;

alter table wineries
  alter column content_status set default 'draft';
