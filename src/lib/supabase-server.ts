import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from './env';

export function createServerSupabase() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createServiceSupabase() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
