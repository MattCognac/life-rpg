import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>

      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi}>
          <div className="flex items-baseline justify-between mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="norse-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
