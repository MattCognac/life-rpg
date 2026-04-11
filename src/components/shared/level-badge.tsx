import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
  lg: "w-20 h-20 text-3xl",
  xl: "w-32 h-32 text-5xl",
};

function tierClasses(level: number) {
  if (level >= 30) return "border-gold/80 from-gold/20 to-primary/20";
  if (level >= 20) return "border-primary/80 from-primary/20 to-primary-dark/20";
  if (level >= 10) return "border-primary/60 from-card-hover to-card";
  return "border-border from-card-hover to-card";
}

export function LevelBadge({ level, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "level-badge-ring relative inline-flex items-center justify-center border-2 bg-gradient-to-br",
        sizeClasses[size],
        tierClasses(level),
        className
      )}
    >
      <Shield
        className="absolute inset-0 w-full h-full text-primary/10"
        strokeWidth={1}
      />
      <div className="relative font-display font-bold text-gold drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]">
        {level}
      </div>
    </div>
  );
}
