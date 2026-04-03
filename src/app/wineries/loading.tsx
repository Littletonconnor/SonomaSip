import { Skeleton } from '@/components/ui/skeleton';

export default function WineriesLoading() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-9 w-44 rounded-lg" />
              <Skeleton className="mt-2 h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="gap-10 lg:grid lg:grid-cols-[220px_1fr]">
          <aside className="max-lg:hidden">
            <div className="flex flex-col gap-6">
              <div>
                <Skeleton className="h-4 w-16 rounded" />
                <div className="mt-3 flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-16 rounded" />
                <div className="mt-3 flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card p-5 ring-1 ring-black/5">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-5 w-10" />
                </div>
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-3/4" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
