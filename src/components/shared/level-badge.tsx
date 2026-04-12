import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  icon?: React.ReactNode;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const levelTextClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

export function LevelBadge({ level, size = "md", className, icon }: Props) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 w-full h-full text-primary/[0.06] flex items-center justify-center">
        {icon ?? <Shield className="w-full h-full" strokeWidth={1} />}
      </div>
      <div className={cn("relative font-norse text-gold drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]", levelTextClasses[size])}>
        {level}
      </div>
    </div>
  );
}
