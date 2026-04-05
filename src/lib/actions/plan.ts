'use server';

import { createServiceSupabase } from '../supabase-server';
import type { QuizAnswers, MatchResult } from '../types';

const PAYLOAD_VERSION = 1;

export async function createPlan(answers: QuizAnswers, results: MatchResult[]): Promise<string> {
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
