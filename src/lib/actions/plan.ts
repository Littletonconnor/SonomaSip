'use server';

import { headers } from 'next/headers';
import { createServiceSupabase } from '../supabase-server';
import type { QuizAnswers, MatchResult } from '../types';
import { planLimiter } from '../rate-limit';

const PAYLOAD_VERSION = 1;

export async function createPlan(answers: QuizAnswers, results: MatchResult[]): Promise<string> {
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const { allowed } = planLimiter.check(ip);
  if (!allowed) throw new Error('Too many plans created. Please try again later.');

  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from('shared_itineraries')
    .insert({
      quiz_answers: JSON.parse(JSON.stringify(answers)),
      results: JSON.parse(JSON.stringify(results)),
      payload_version: PAYLOAD_VERSION,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to create plan');
  }

  return data.id;
}
