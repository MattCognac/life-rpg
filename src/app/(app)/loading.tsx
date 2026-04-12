import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero card skeleton */}
      <div className="norse-card p-6">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-3 w-32 mx-auto md:mx-0" />
            <Skeleton className="h-7 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-5 w-full max-w-md mx-auto md:mx-0" />
            <div className="flex gap-6 justify-center md:justify-start">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Quests + Dailies row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 norse-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="norse-card p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Skills + Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="norse-card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="norse-card p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
