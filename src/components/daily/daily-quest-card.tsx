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
    skill?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
  completedToday: boolean;
}

export function DailyQuestCard({ quest, streak, completedToday }: Props) {
  return (
    <div className="relative ember-hover cursor-pointer">
      <Link href={`/quests/${quest.id}`} className="absolute inset-0 z-10" />
      <div
        className={cn(
          "norse-card p-4 transition-all cursor-pointer relative z-20 pointer-events-none [&_button]:pointer-events-auto [&_button]:relative [&_button]:z-30",
          completedToday && "border-success/40 opacity-90"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {completedToday && (
                <Badge variant="success">
                  <Check className="w-3 h-3 mr-1" />
                  Done today
                </Badge>
              )}
              {quest.skill && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: `${quest.skill.color}80`,
                    color: quest.skill.color,
                    backgroundColor: `${quest.skill.color}10`,
                  }}
                >
                  {quest.skill.name}
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
              <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">
                {quest.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-gold font-display">
              <Zap className="w-3 h-3" />
              <span>{quest.xpReward}</span>
            </div>
            <DailyQuestMenu questId={quest.id} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <DifficultyStars difficulty={quest.difficulty} />
            <StreakDisplay
              streak={streak?.currentStreak ?? 0}
              longest={streak?.longestStreak}
              size="sm"
            />
          </div>
          <CompleteQuestButton
            questId={quest.id}
            completed={completedToday}
            isDaily
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
