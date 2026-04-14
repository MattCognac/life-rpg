import Link from "next/link";
import { DifficultyStars } from "./difficulty-stars";
import { CompleteQuestButton } from "./complete-quest-button";
import { Zap, Lock, Check, Sun, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    xpReward: number;
    status: string;
    isDaily: boolean;
    chain?: {
      id: string;
      name: string;
    } | null;
  };
  href?: string;
  compact?: boolean;
  variant?: "card" | "row";
}

export function QuestCard({ quest, href, compact, variant = "card" }: QuestCardProps) {
  const isLocked = quest.status === "locked";
  const isCompleted = quest.status === "completed";
  const isActive = quest.status === "active";
  const isRow = variant === "row";

  const chainRow = quest.chain ? (
    <Link
      href={`/chains/${quest.chain.id}`}
      className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors max-w-[min(100%,14rem)]"
    >
      <Link2 className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{quest.chain.name}</span>
    </Link>
  ) : null;

  const card = isRow ? (
    <div
      className={cn(
        "py-3 group transition-all border-b border-border/50 last:border-b-0 hover:bg-muted/30",
        isLocked && "opacity-50",
        href && "cursor-pointer"
      )}
    >
      <div className="space-y-2">
        {chainRow && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">{chainRow}</div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isLocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
            {isCompleted && <Check className="w-3 h-3 text-success flex-shrink-0" />}
            {quest.isDaily && <Sun className="w-3 h-3 text-gold flex-shrink-0" />}
            <div
              className={cn(
                "font-display text-base tracking-wider uppercase text-foreground truncate",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {quest.title}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 text-gold font-display">
              <Zap className="w-3 h-3" />
              <span className="text-sm">{quest.xpReward}</span>
            </div>
            {isActive && <CompleteQuestButton questId={quest.id} size="icon" />}
            {isCompleted && <CompleteQuestButton questId={quest.id} completed size="icon" />}
          </div>
        </div>
        <div className="flex items-center pt-0.5">
          <DifficultyStars difficulty={quest.difficulty} />
        </div>
      </div>
    </div>
  ) : (
    <div
      className={cn(
        "norse-card p-4 ember-hover group transition-all",
        isLocked && "opacity-50",
        isCompleted && "border-success/40",
        href && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
            {isCompleted && <Check className="w-3 h-3 text-success" />}
            {quest.isDaily && <Sun className="w-3 h-3 text-gold" />}
          </div>
          {chainRow}
          <div
            className={cn(
              "font-display text-base tracking-wider uppercase text-foreground",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {quest.title}
          </div>
          {!compact && quest.description && (
            <p className="text-xs text-muted-foreground font-body line-clamp-2">
              {quest.description}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 text-gold font-display self-start">
          <Zap className="w-3 h-3" />
          <span className="text-sm">{quest.xpReward}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <DifficultyStars difficulty={quest.difficulty} />
        <div className="flex items-center gap-2">
          {isActive && <CompleteQuestButton questId={quest.id} size="sm" />}
          {isCompleted && <CompleteQuestButton questId={quest.id} completed size="sm" />}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <div className="relative ember-hover cursor-pointer">
        <Link href={href} className="absolute inset-0 z-10" />
        <div className="relative z-20 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:relative [&_a]:relative [&_button]:z-30 [&_a]:z-30">
          {card}
        </div>
      </div>
    );
  }
  return card;
}
