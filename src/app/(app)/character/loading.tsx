import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="norse-card p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-3 w-32 mx-auto md:mx-0" />
            <Skeleton className="h-9 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-5 w-full max-w-md mx-auto md:mx-0" />
            <div className="flex gap-6 justify-center md:justify-start">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Disciplines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
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
    </div>
  );
}
