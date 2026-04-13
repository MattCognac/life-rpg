import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { Trophy } from "lucide-react";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const pascal = name
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join("");
  return icons[pascal] ?? icons.Trophy;
}

interface AchievementSummary {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

interface Props {
  achievements: AchievementSummary[];
}

export function RecentTrophies({ achievements }: Props) {
  return (
    <div className="norse-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl tracking-widest uppercase text-foreground">
          Recent Trophies
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
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-body">
              No trophies unlocked yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {achievements.map((a) => {
            const Icon = getIcon(a.icon);
            return (
              <div
                key={a.key}
                className="flex items-center gap-3 border border-gold/30 bg-gold/5 p-3"
                style={{ boxShadow: "0 0 12px hsl(var(--gold) / 0.1)" }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center border border-gold/50 bg-gold/10 flex-shrink-0"
                  style={{ boxShadow: "0 0 10px hsl(var(--gold) / 0.2)" }}
                >
                  <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm tracking-wider uppercase text-gold truncate">
                    {a.name}
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground truncate">
                    {a.description}
                  </p>
                </div>
                <div className="text-[9px] font-display uppercase tracking-widest text-muted-foreground flex-shrink-0">
                  {relativeTime(a.unlockedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
