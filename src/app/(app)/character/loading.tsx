import { Skeleton } from "@/components/ui/skeleton";

const WHEEL_SIZE = 480;
const ORBIT_RADIUS = 160;
const NODE_SIZE = 96;
const CENTER_SIZE = 72;

export default function CharacterLoading() {
  const cx = WHEEL_SIZE / 2;
  const cy = WHEEL_SIZE / 2;

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

      {/* Identity + Skills row */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <div className="norse-card p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-48 mt-4" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Desktop wheel skeleton */}
          <div className="hidden md:flex justify-center">
            <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
              <Skeleton
                className="absolute rounded-full"
                style={{
                  width: CENTER_SIZE,
                  height: CENTER_SIZE,
                  top: cy - CENTER_SIZE / 2,
                  left: cx - CENTER_SIZE / 2,
                }}
              />
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * (2 * Math.PI)) / 6 - Math.PI / 2;
                return (
                  <Skeleton
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: NODE_SIZE,
                      height: NODE_SIZE,
                      top: cy + ORBIT_RADIUS * Math.sin(angle) - NODE_SIZE / 2,
                      left: cx + ORBIT_RADIUS * Math.cos(angle) - NODE_SIZE / 2,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Mobile grid skeleton */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>

          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>

      {/* Bottom row: chains + trophies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="norse-card p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
