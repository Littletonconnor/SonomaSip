-- Add has_outdoor_seating column to wineries table.
-- Added to experiences.csv as a boolean; was missing from the original schema.
alter table wineries
  add column if not exists has_outdoor_seating boolean not null default false;
