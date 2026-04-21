import { Skeleton } from "./ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="px-4 pt-6 space-y-4 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-11 h-11 rounded-full" />
          <Skeleton className="w-11 h-11 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[0, 1].map(i => (
          <div key={i} className="glass rounded-3xl p-5 space-y-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl p-5 space-y-4">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-full h-3 rounded-full" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-5 space-y-4">
        <Skeleton className="h-4 w-32 rounded mb-2" />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="w-8 h-4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
