export default function WineryDetailPage(_props: { params: Promise<{ slug: string }> }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold tracking-tight">Winery Detail</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Winery story, hours, experiences, flights, and logistics will go here.
      </p>
    </main>
  );
}
