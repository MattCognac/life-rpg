import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  current: number;
  max: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}

export function XpBar({ current, max, showLabel = true, color, className }: Props) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className={cn("w-full", className)}>
      <div className="xp-bar">
        <div
          className="xp-bar-fill"
          style={{
            width: `${pct}%`,
            ...(color && {
              background: `linear-gradient(90deg, ${color}CC, ${color}, ${color}EE)`,
              boxShadow: `0 0 12px ${color}99`,
            }),
          }}
        />
      </div>
      {showLabel && (
        <div className="text-[10px] font-body tracking-wider text-muted-foreground mt-1 flex justify-between">
          <span>{formatNumber(current)} XP</span>
          <span>{formatNumber(max)}</span>
        </div>
      )}
    </div>
  );
}
