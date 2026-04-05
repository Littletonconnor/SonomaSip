import { createServerSupabase } from '../supabase-server';
import type { QuizAnswers, MatchResult } from '../types';

export type SharedItinerary = {
  id: string;
  quizAnswers: QuizAnswers;
  results: MatchResult[];
  createdAt: string;
};

export async function getSharedItinerary(id: string): Promise<SharedItinerary | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('shared_itineraries')
    .select('id, quiz_answers, results, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    quizAnswers: data.quiz_answers as unknown as QuizAnswers,
    results: data.results as unknown as MatchResult[],
    createdAt: data.created_at,
  };
}
