import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ResultsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="font-heading text-wine text-sm font-medium tracking-wide italic">Coming soon</p>
      <h1 className="text-bark mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Your Recommendations
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-center">
        Your personalized winery rankings will appear here after completing the quiz.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/quiz">Take the Quiz</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    </main>
  );
}
