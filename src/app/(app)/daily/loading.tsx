import { Skeleton } from "@/components/ui/skeleton";

export default function DailyLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="norse-card p-4 space-y-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="norse-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
