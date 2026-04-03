import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Sorry, we couldn&apos;t find that page.
      </p>
      <Link
        href="/"
        className="bg-foreground text-background mt-8 rounded-full px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
      >
        Back to Home
      </Link>
    </main>
  );
}
