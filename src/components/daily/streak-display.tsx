import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  streak: number;
  longest?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function streakColor(streak: number): string {
  if (streak >= 30) return "#c084fc"; // purple
  if (streak >= 14) return "#60a5fa"; // blue
  if (streak >= 7) return "#ff8201";  // gold
  if (streak >= 3) return "#dd6119";  // orange
  return "#6b7280";                   // gray
}

export function StreakDisplay({ streak, longest, size = "md", className }: Props) {
  const color = streakColor(streak);
  const flameSize = size === "sm" ? 14 : size === "lg" ? 28 : 18;
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Flame
        style={{
          color,
          filter: streak > 0 ? `drop-shadow(0 0 6px ${color})` : "none",
        }}
        width={flameSize}
        height={flameSize}
        strokeWidth={2}
        fill={streak > 0 ? color : "none"}
      />
      <span
        className={cn("font-display tracking-wider", textSize)}
        style={{ color: streak > 0 ? color : "hsl(var(--muted-foreground))" }}
      >
        {streak}
      </span>
      {longest !== undefined && longest > streak && (
        <span className="text-[10px] font-body text-muted-foreground ml-1">
          (best {longest})
        </span>
      )}
    </div>
  );
}
