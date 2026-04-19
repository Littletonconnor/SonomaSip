-- Add `archetype_scores` to wineries for the Quiz v1.0 archetype-based ranking.
--
-- Shape: { explorer, collector, student, socializer, romantic } with each
-- value in 0-10. Every key is optional — the matcher treats a missing key
-- as 0 (i.e. this winery doesn't rank toward that archetype). Editorial
-- backfill for the 68 published wineries populates this per-row judgment.
--
-- See docs/sonoma-sip-quiz-spec.md and TODO.md §1 for the full rewrite plan.
-- score.ts will read `archetype_scores[userArchetype] / 10` as the rank signal.

alter table wineries
  add column archetype_scores jsonb not null default '{}'::jsonb;
