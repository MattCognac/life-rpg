import Link from "next/link";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { Button } from "@/components/ui/button";
import { Sun, Plus, ArrowRight, Check, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Daily {
  id: string;
  title: string;
  xpReward: number;
  difficulty: number;
}

interface DailyWithMeta {
  quest: Daily;
  streak: { currentStreak: number; longestStreak: number } | null;
  completedToday: boolean;
}

interface Props {
  dailies: DailyWithMeta[];
  totalActive: number;
}

export function DailiesBlock({ dailies, totalActive }: Props) {
  const completedCount = dailies.filter((d) => d.completedToday).length;

  return (
    <div className="norse-card p-5 flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
            Dailies
          </h2>
          {totalActive > 0 && (
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground/70 mt-1">
              {completedCount}/{totalActive} today
            </div>
          )}
        </div>
        <Link href="/quests/new">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {dailies.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center gap-3 text-center flex-1">
          <Sun className="w-7 h-7 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No dailies yet. Build habits that stick.
          </p>
          <Link href="/quests/new">
            <Button variant="ghost" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create Daily
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/50 pt-1 flex-1">
          {dailies.map(({ quest, streak, completedToday }) => (
            <div
              key={quest.id}
              className="flex items-center justify-between gap-2 py-2.5"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Link
                  href={`/quests/${quest.id}`}
                  className={cn(
                    "font-display text-sm tracking-wider uppercase truncate hover:text-primary transition-colors",
                    completedToday
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {quest.title}
                </Link>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <DifficultyStars difficulty={quest.difficulty} />
                <div className="flex items-center gap-1 text-gold font-display">
                  <Zap className="w-3 h-3" />
                  <span className="text-sm">{quest.xpReward}</span>
                </div>
                {streak && streak.currentStreak > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] font-display text-orange-400">
                    <Flame className="w-2.5 h-2.5" />
                    {streak.currentStreak}
                  </div>
                )}
                {completedToday ? (
                  <div className="w-7 h-7 rounded-md bg-success/15 border border-success/40 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-success" />
                  </div>
                ) : (
                  <CompleteQuestButton
                    questId={quest.id}
                    isDaily
                    size="icon"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {dailies.length > 0 && (
        <div className="flex justify-end mt-auto pt-3">
          <Link
            href="/daily"
            className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
