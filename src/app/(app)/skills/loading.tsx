import { Skeleton } from "@/components/ui/skeleton";

export default function SkillsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, gi) => (
          <div key={gi}>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="norse-card p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
