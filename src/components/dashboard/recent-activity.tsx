import { Swords, Star, Trophy, Link2, Sparkles } from "lucide-react";
import { relativeTime } from "@/lib/utils";

interface Entry {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
}

const iconFor = (type: string) => {
  switch (type) {
    case "quest_complete":
      return Swords;
    case "level_up":
      return Star;
    case "skill_level_up":
      return Sparkles;
    case "achievement_unlock":
      return Trophy;
    case "chain_complete":
      return Link2;
    default:
      return Swords;
  }
};

const colorFor = (type: string): string => {
  switch (type) {
    case "level_up":
    case "achievement_unlock":
      return "#ff8201";
    case "skill_level_up":
      return "#dd6119";
    case "chain_complete":
      return "#c084fc";
    default:
      return "#c4b99a";
  }
};

export function RecentActivity({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground font-body py-6">
        No activity yet. Complete your first quest to begin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const Icon = iconFor(entry.type);
        const color = colorFor(entry.type);
        return (
          <div key={entry.id} className="flex items-start gap-3">
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center border"
              style={{
                borderColor: `${color}60`,
                backgroundColor: `${color}10`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-body text-foreground">
                {entry.message}
              </div>
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-0.5">
                {relativeTime(entry.createdAt)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
