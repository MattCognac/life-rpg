import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const pascal = name
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join("");
  return icons[pascal] ?? icons.Trophy;
}

export interface UpcomingAchievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unit: string;
}

interface Props {
  achievements: UpcomingAchievement[];
}

export function UpcomingTrophies({ achievements }: Props) {
  return (
    <div className="norse-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl tracking-widest uppercase text-foreground">
          Next Trophies
        </h2>
        <Link
          href="/achievements"
          className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          View All
        </Link>
      </div>

      {achievements.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-6">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-body">
              All trophies unlocked!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {achievements.map((a) => {
            const Icon = getIcon(a.icon);
            const pct = a.target > 0 ? Math.min(100, (a.progress / a.target) * 100) : 0;

            return (
              <div
                key={a.key}
                className="border border-border bg-card/50 p-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 flex items-center justify-center border border-border bg-card-hover flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm tracking-wider uppercase text-foreground/70 truncate">
                      {a.name}
                    </div>
                    <p className="text-[10px] font-body text-muted-foreground truncate">
                      {a.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 xp-bar !h-2">
                    <div
                      className="h-full bg-muted-foreground/40 relative"
                      style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                    />
                  </div>
                  <span className="text-[9px] font-display uppercase tracking-widest text-muted-foreground flex-shrink-0">
                    {a.progress}/{a.target} {a.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
