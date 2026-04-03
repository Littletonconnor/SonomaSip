import { Skeleton } from '@/components/ui/skeleton';

export default function PlanLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div className="gap-12 lg:grid lg:grid-cols-[2fr_3fr]">
        <div className="lg:sticky lg:top-20 lg:self-start lg:pb-12">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-9 w-72 rounded-lg" />
          <Skeleton className="mt-2 h-5 w-48" />

          <div className="mt-6">
            <Skeleton className="h-4 w-24" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>

          <Skeleton className="mt-8 aspect-4/3 w-full rounded-2xl" />
        </div>

        <div className="flex flex-col max-lg:mt-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex gap-5 py-7 sm:gap-7 ${i > 0 ? 'border-t border-black/5' : ''}`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center">
                <Skeleton className="size-10 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <div className="mt-2 flex gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-52" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-4 h-9 w-32 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
