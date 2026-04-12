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
      <div className="xp-bar relative">
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
        {showLabel && (
          <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-body tracking-wider text-foreground/70">
            {formatNumber(current)} / {formatNumber(max)} XP
          </span>
        )}
      </div>
    </div>
  );
}
