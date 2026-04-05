'use server';

import type { Json } from '../database.types';
import type { MatchResult, QuizAnswers } from '../types';
import { getWineriesForMatching } from '../data/wineries';
import { getWineryLookup } from '../data/winery-lookup';
import { recommend } from '../matching/index';
import { createServiceSupabase } from '../supabase-service';

function validateQuizAnswers(answers: unknown): asserts answers is QuizAnswers {
  if (!answers || typeof answers !== 'object') {
    throw new Error('Invalid quiz answers: expected an object');
  }

  const a = answers as Record<string, unknown>;

  if (!Array.isArray(a.selectedVarietals)) {
    throw new Error('Invalid quiz answers: selectedVarietals must be an array');
  }
  if (!Array.isArray(a.selectedVibes)) {
    throw new Error('Invalid quiz answers: selectedVibes must be an array');
  }
  if (typeof a.numStops !== 'number' || a.numStops < 1) {
    throw new Error('Invalid quiz answers: numStops must be a positive number');
  }
  if (!a.mustHaves || typeof a.mustHaves !== 'object') {
    throw new Error('Invalid quiz answers: mustHaves must be an object');
  }
}

export async function submitQuiz(answers: QuizAnswers): Promise<MatchResult[]> {
  validateQuizAnswers(answers);

  const [wineries, wineryLookup] = await Promise.all([getWineriesForMatching(), getWineryLookup()]);

  return recommend(wineries, answers, wineryLookup);
}

export async function shareItinerary(
  answers: QuizAnswers,
  results: MatchResult[],
): Promise<{ id: string }> {
  validateQuizAnswers(answers);

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Cannot share an empty itinerary');
  }

  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from('shared_itineraries')
    .insert({
      quiz_answers: JSON.parse(JSON.stringify(answers)) as Json,
      results: JSON.parse(JSON.stringify(results)) as Json,
      payload_version: 1,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to save itinerary');
  }

  return { id: data.id };
}
