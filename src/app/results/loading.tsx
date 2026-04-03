import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsLoading() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Skeleton className="h-9 w-72 rounded-lg" />
              <Skeleton className="mt-3 h-5 w-48" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="gap-12 lg:grid lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex gap-5 py-7 sm:gap-7 ${i > 0 ? 'border-t border-black/5' : ''}`}
              >
                <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-2 h-7 w-56 rounded-lg" />
                  <div className="mt-2 flex gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="max-lg:mt-10 lg:sticky lg:top-20 lg:self-start">
            <Skeleton className="aspect-4/3 w-full rounded-2xl" />
            <div className="mt-4 flex flex-col gap-3 px-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="ml-auto h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
