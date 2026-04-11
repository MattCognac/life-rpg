import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/lib/constants";
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  difficulty: number;
  showLabel?: boolean;
  className?: string;
}

export function DifficultyStars({ difficulty, showLabel = false, className }: Props) {
  const color = DIFFICULTY_COLORS[difficulty] ?? "#9ca3af";
  const label = DIFFICULTY_LABELS[difficulty] ?? "Unknown";

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Swords
          key={i}
          className="w-3 h-3"
          style={{
            color: i <= difficulty ? color : "hsl(var(--border))",
            filter: i <= difficulty ? `drop-shadow(0 0 2px ${color})` : "none",
          }}
          fill={i <= difficulty ? color : "none"}
          strokeWidth={1.5}
        />
      ))}
      {showLabel && (
        <span
          className="ml-2 text-[10px] font-display uppercase tracking-widest"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
