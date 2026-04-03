import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WineriesPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="font-heading text-wine text-sm font-medium tracking-wide italic">Coming soon</p>
      <h1 className="text-bark mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        All Wineries
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-center">
        The full directory of 68 curated Sonoma County wineries is being built. In the meantime, try
        the quiz to get personalized recommendations.
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
