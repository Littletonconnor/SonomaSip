'use server';

import { headers } from 'next/headers';
import type { MatchResult, QuizAnswers } from '../types';
import { getWineriesForMatching } from '../data/wineries';
import { getWineryLookup } from '../data/winery-lookup';
import { recommend } from '../matching/index';
import { quizLimiter } from '../rate-limit';

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

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const { allowed } = quizLimiter.check(ip);
  if (!allowed) throw new Error('Too many quiz submissions. Please try again later.');

  const [wineries, wineryLookup] = await Promise.all([getWineriesForMatching(), getWineryLookup()]);

  return recommend(wineries, answers, wineryLookup);
}
