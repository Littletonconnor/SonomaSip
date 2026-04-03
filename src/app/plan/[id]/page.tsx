export default function SharedPlanPage(_props: { params: Promise<{ id: string }> }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold tracking-tight">Shared Plan</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Read-only shared itinerary will go here.
      </p>
    </main>
  );
}
