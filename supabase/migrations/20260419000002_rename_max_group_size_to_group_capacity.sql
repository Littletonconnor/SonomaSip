-- Rename `max_group_size` to `group_capacity`.
--
-- The Quiz v1.0 archetype redesign (TODO §1) standardizes on `group_capacity`
-- to pair cleanly with the new `group_composition` quiz answer. Rename (not
-- add-and-copy) so we don't end up with two columns meaning the same thing.
--
-- The existing smallint type is preserved — group sizes never exceed its
-- range, and changing type would trigger a table rewrite for no benefit.

alter table wineries
  rename column max_group_size to group_capacity;
