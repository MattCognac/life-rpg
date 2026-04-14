import Link from "next/link";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { Badge } from "@/components/ui/badge";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";
import { DailyQuestMenu } from "./daily-quest-menu";
import { StreakDisplay } from "./streak-display";
import { Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  quest: {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    xpReward: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
  completedToday: boolean;
  inactive?: boolean;
  scheduleName?: string;
}

export function DailyQuestCard({ quest, streak, completedToday, inactive, scheduleName }: Props) {
  return (
    <div className={cn("relative cursor-pointer", !inactive && "ember-hover")}>
      <Link href={`/quests/${quest.id}`} className="absolute inset-0 z-10" />
      <div
        className={cn(
          "norse-card p-4 transition-all cursor-pointer relative z-20 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:relative [&_a]:relative [&_button]:z-30 [&_a]:z-30",
          completedToday && "border-success/40 opacity-90",
          inactive && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {completedToday && (
                <Badge variant="success">
                  <Check className="w-3 h-3 mr-1" />
                  Done today
                </Badge>
              )}
              {inactive && scheduleName && (
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                  {scheduleName}
                </Badge>
              )}
            </div>
            <div
              className={cn(
                "font-display text-base tracking-wider uppercase",
                completedToday ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {quest.title}
            </div>
            {quest.description && (
              <p className="text-xs text-muted-foreground font-body line-clamp-2">
                {quest.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-gold font-display">
              <Zap className="w-3 h-3" />
              <span className="text-sm">{quest.xpReward}</span>
            </div>
            <DailyQuestMenu questId={quest.id} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <DifficultyStars difficulty={quest.difficulty} />
            <StreakDisplay
              streak={streak?.currentStreak ?? 0}
              longest={streak?.longestStreak}
              size="sm"
            />
          </div>
          {!inactive && (
            <CompleteQuestButton
              questId={quest.id}
              completed={completedToday}
              isDaily
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
