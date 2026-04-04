import { Skeleton } from '@/components/ui/skeleton';

export default function WineryDetailLoading() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="gap-16 lg:grid lg:grid-cols-[280px_1fr]">
          <aside className="max-lg:mb-10 lg:sticky lg:top-20 lg:self-start">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="mt-2 h-5 w-32" />
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-lg" />
            <div className="mt-8 flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-4 w-20" />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Skeleton className="h-5 w-20 rounded" />
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div>
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <div className="mt-12">
              <Skeleton className="h-6 w-24 rounded" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-5 ring-1 ring-black/5">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-1 h-4 w-2/3" />
                    <div className="mt-4 flex items-center gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <Skeleton className="h-6 w-16 rounded" />
              <div className="mt-4 flex flex-col gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
