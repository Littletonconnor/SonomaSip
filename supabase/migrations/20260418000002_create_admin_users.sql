-- Admin users — credentials for the `/admin/*` panel.
--
-- Password is stored as a scrypt-derived hash string:
--   scrypt$<N>$<r>$<p>$<salt_hex>$<hash_hex>
-- Verification uses Node's built-in crypto.scrypt; no external hashing dep.
-- See scripts/seed-admin-users.ts for the hashing helper.
--
-- RLS is enabled with no policies, so only the service role (used by server-
-- side auth) can read/write. The anon key has zero access, which is what we
-- want — the client never touches this table.

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index idx_admin_users_username on admin_users (lower(username));

alter table admin_users enable row level security;
