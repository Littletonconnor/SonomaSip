import { createServerSupabase } from '@/lib/supabase-server';
import type { MatchResult, QuizAnswers } from '@/lib/types';

export interface SharedPlan {
  id: string;
  createdAt: string;
  quizAnswers: QuizAnswers;
  results: MatchResult[];
}

export async function getPlan(id: string): Promise<SharedPlan | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('shared_itineraries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    quizAnswers: data.quiz_answers as unknown as QuizAnswers,
    results: data.results as unknown as MatchResult[],
  };
}
