import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  // Convert kebab-case key like "shield-check" to PascalCase "ShieldCheck"
  const pascal = name
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join("");
  return icons[pascal] ?? icons.Trophy;
}

interface Props {
  achievement: {
    key: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date | null;
  };
}

export function AchievementCard({ achievement }: Props) {
  const unlocked = !!achievement.unlockedAt;
  const Icon = getIcon(achievement.icon);

  return (
    <div
      className={cn(
        "norse-card p-5 flex items-start gap-4 transition-all",
        unlocked
          ? "border-gold/40 ember-hover"
          : "opacity-60 grayscale"
      )}
      style={
        unlocked
          ? { boxShadow: "0 0 20px hsl(var(--gold) / 0.15)" }
          : undefined
      }
    >
      <div
        className={cn(
          "w-14 h-14 flex items-center justify-center border-2 flex-shrink-0",
          unlocked
            ? "border-gold/60 bg-gold/10"
            : "border-border bg-card-hover"
        )}
        style={
          unlocked
            ? { boxShadow: "0 0 15px hsl(var(--gold) / 0.3)" }
            : undefined
        }
      >
        <Icon
          className={cn("w-7 h-7", unlocked ? "text-gold" : "text-muted-foreground")}
          strokeWidth={1.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-display text-sm tracking-wider uppercase",
            unlocked ? "text-gold" : "text-muted-foreground"
          )}
        >
          {unlocked ? achievement.name : "???"}
        </div>
        <p className="text-xs font-body text-muted-foreground mt-1">
          {unlocked ? achievement.description : "Locked"}
        </p>
        {unlocked && achievement.unlockedAt && (
          <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-2">
            Unlocked {relativeTime(achievement.unlockedAt)}
          </div>
        )}
      </div>
    </div>
  );
}
