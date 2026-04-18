/**
 * Seed the two admin users for the /admin panel.
 *
 * Reads credentials from env vars — nothing is hardcoded in source:
 *   ADMIN_USER_1_USERNAME, ADMIN_USER_1_PASSWORD
 *   ADMIN_USER_2_USERNAME, ADMIN_USER_2_PASSWORD
 *
 * Passwords are hashed with scrypt (see src/lib/auth/password.ts) before
 * insert. Re-running the script updates the hash for an existing username
 * (password rotation) without touching created_at.
 *
 * Usage:
 *   pnpm seed:admins            # upsert both users
 *   pnpm seed:admins --dry-run  # validate env, hash, no DB writes
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/lib/auth/password.js';

const DRY_RUN = process.argv.includes('--dry-run');

interface SeedUser {
  username: string;
  password: string;
}

function readUsers(): SeedUser[] {
  const users: SeedUser[] = [];
  for (const n of [1, 2]) {
    const username = process.env[`ADMIN_USER_${n}_USERNAME`];
    const password = process.env[`ADMIN_USER_${n}_PASSWORD`];
    if (!username || !password) {
      throw new Error(`Missing ADMIN_USER_${n}_USERNAME or ADMIN_USER_${n}_PASSWORD in env.`);
    }
    if (password.length < 12) {
      throw new Error(`ADMIN_USER_${n}_PASSWORD must be at least 12 characters.`);
    }
    users.push({ username, password });
  }
  return users;
}

async function run() {
  console.log(`\n=== Seed admin users${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  const users = readUsers();
  const hashed = await Promise.all(
    users.map(async (u) => ({
      username: u.username,
      password_hash: await hashPassword(u.password),
    })),
  );

  for (const u of hashed) {
    console.log(`  ${u.username} → ${u.password_hash.slice(0, 24)}…`);
  }

  if (DRY_RUN) {
    console.log('\nDry run — no database writes.');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (const u of hashed) {
    const { error } = await supabase
      .from('admin_users')
      .upsert(
        {
          username: u.username,
          password_hash: u.password_hash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' },
      );
    if (error) {
      console.error(`  Failed to upsert ${u.username}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`\nUpserted ${hashed.length} admin users.`);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
