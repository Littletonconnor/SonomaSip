import { z } from 'zod/v4';

const publicSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().startsWith('pk.').optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  // Future server-only secrets go here:
  // SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // RESEND_API_KEY: z.string().startsWith('re_'),
});

const merged = z.object({
  ...publicSchema.shape,
  ...serverSchema.shape,
});

function validateEnv() {
  const result = merged.safeParse(process.env);

  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    console.error('❌ Invalid environment variables:\n', formatted);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = validateEnv();
