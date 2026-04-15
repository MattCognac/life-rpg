import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { px: 40, stroke: 3, fontSize: "text-sm", iconSize: "w-4 h-4" },
  md: { px: 64, stroke: 3.5, fontSize: "text-lg", iconSize: "w-6 h-6" },
  lg: { px: 80, stroke: 4, fontSize: "text-2xl", iconSize: "w-8 h-8" },
} as const;

interface Props {
  level: number;
  progress: number;
  size?: keyof typeof SIZES;
  icon?: ReactNode;
  className?: string;
}

export function LevelRing({
  level,
  progress,
  size = "sm",
  icon,
  className,
}: Props) {
  const { px, stroke, fontSize, iconSize } = SIZES[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - Math.min(1, Math.max(0, progress)) * circumference;
  const gradientId = `ring-grad-${size}`;

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: px, height: px }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(10, 75%, 38%)" />
            <stop offset="50%" stopColor="hsl(20, 78%, 48%)" />
            <stop offset="100%" stopColor="hsl(32, 100%, 50%)" />
          </linearGradient>
        </defs>
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
          style={{ filter: "drop-shadow(0 0 4px hsl(20 78% 48% / 0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <span className={iconSize}>{icon}</span>
        ) : (
          <span className={cn("font-display leading-none text-gold", fontSize)}>
            {level}
          </span>
        )}
      </div>
    </div>
  );
}
