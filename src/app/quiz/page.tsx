'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QuizPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="font-heading text-sm font-medium italic tracking-wide text-wine">
        Coming soon
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-bark md:text-4xl">
        Find Your Wineries
      </h1>
      <p className="mt-4 max-w-md text-center text-muted-foreground">
        The personalized winery quiz is being built. You&apos;ll answer a few quick questions
        about varietals, vibe, budget, and group needs — then get a ranked list of matches.
      </p>
      <Button variant="outline" className="mt-8" asChild>
        <Link href="/">Back Home</Link>
      </Button>
    </main>
  );
}
