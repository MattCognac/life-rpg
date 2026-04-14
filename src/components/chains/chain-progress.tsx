import Link from "next/link";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { Check, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";

interface Props {
  quests: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: number;
    xpReward: number;
    status: string;
    chainOrder: number | null;
  }>;
}

export function ChainProgress({ quests }: Props) {
  const sorted = [...quests].sort(
    (a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0)
  );

  return (
    <div className="space-y-0">
      {sorted.map((quest, i) => {
        const isCompleted = quest.status === "completed";
        const isLocked = quest.status === "locked";
        const isActive = quest.status === "active";
        const isLast = i === sorted.length - 1;

        return (
          <div key={quest.id} className="relative isolate flex gap-4 pb-6">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[18px] top-9 bottom-0 w-0.5 -z-10",
                  isCompleted ? "bg-success" : "bg-border"
                )}
              />
            )}

            {/* Node */}
            <div
              className={cn(
                "relative z-10 w-9 h-9 flex-shrink-0 rounded-full border-2 flex items-center justify-center font-display text-sm",
                "bg-card",
                isCompleted && "border-success text-success",
                isActive && "border-primary text-primary animate-ember-glow",
                isLocked && "border-border text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : isLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                i + 1
              )}
            </div>

            {/* Card */}
            <div className="relative flex-1 min-w-0">
              <Link href={`/quests/${quest.id}`} className="absolute inset-0 z-10" />
              <div
                className={cn(
                  "norse-card p-4 transition-colors cursor-pointer relative z-20 pointer-events-none [&_button]:pointer-events-auto [&_button]:relative [&_button]:z-30",
                  isLocked && "opacity-50",
                  isCompleted && "border-success/30",
                  isActive && "border-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div
                      className={cn(
                        "font-display text-sm md:text-base tracking-wider uppercase",
                        isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    >
                      {quest.title}
                    </div>
                    {quest.description && (
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {quest.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gold font-display text-sm flex-shrink-0 self-start">
                    <Zap className="w-3 h-3" />
                    {quest.xpReward}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border/50">
                  <DifficultyStars difficulty={quest.difficulty} />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted && (
                      <CompleteQuestButton questId={quest.id} completed size="sm" />
                    )}
                    {isActive && <CompleteQuestButton questId={quest.id} size="sm" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
