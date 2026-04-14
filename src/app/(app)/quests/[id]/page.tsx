import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";
import { DeleteQuestButton } from "@/components/quests/delete-quest-button";
import { disciplineAccentColor } from "@/lib/skill-display";
import { Zap, Lock, Sun, Link2, Pencil } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getAuthUser } = await import("@/lib/auth");
  const userId = await getAuthUser();
  const quest = await db.quest.findFirst({
    where: { id, userId },
    include: {
      skill: { include: { parent: { select: { name: true, color: true } } } },
      chain: true,
      secondarySkills: {
        include: { skill: { include: { parent: { select: { color: true } } } } },
      },
      completions: {
        orderBy: { completedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!quest) notFound();

  const isLocked = quest.status === "locked";
  const isCompleted = quest.status === "completed";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/quests" />

      <div className="norse-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {isLocked && (
              <Badge variant="secondary">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
            {isCompleted && <Badge variant="success">Completed</Badge>}
            {quest.isDaily && (
              <Badge variant="gold">
                <Sun className="w-3 h-3 mr-1" />
                Daily
              </Badge>
            )}
            {quest.chain && (
              <Link href={`/chains/${quest.chain.id}`}>
                <Badge variant="outline">
                  <Link2 className="w-3 h-3 mr-1" />
                  {quest.chain.name}
                </Badge>
              </Link>
            )}
            {quest.skill && (
              <Badge
                variant="outline"
                style={{
                  borderColor: `${disciplineAccentColor(quest.skill)}80`,
                  color: disciplineAccentColor(quest.skill),
                }}
              >
                {quest.skill.name}
              </Badge>
            )}
            {quest.secondarySkills.map((qs) => {
              const accent = disciplineAccentColor(qs.skill);
              return (
                <Badge
                  key={qs.id}
                  variant="outline"
                  className="opacity-60"
                  style={{
                    borderColor: `${accent}50`,
                    color: accent,
                  }}
                >
                  {qs.skill.name}
                  <span className="ml-1 text-[9px] opacity-70">+50% XP</span>
                </Badge>
              );
            })}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:justify-end">
            <Link href={`/quests/${quest.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </Link>
            <DeleteQuestButton id={quest.id} redirectTo="/quests" />
          </div>
        </div>

        <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-foreground">
          {quest.title}
        </h1>

        {quest.description && (
          <p className="text-sm text-muted-foreground font-body mt-3 whitespace-pre-wrap">
            {quest.description}
          </p>
        )}

        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap items-end gap-8 min-w-0">
              <div>
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  Difficulty
                </div>
                <DifficultyStars
                  difficulty={quest.difficulty}
                  showLabel
                  className="mt-1"
                />
              </div>
              <div>
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  XP Reward
                </div>
                <div className="flex items-center gap-1 mt-1 text-gold font-display text-lg">
                  <Zap className="w-4 h-4" />
                  {quest.xpReward}
                </div>
              </div>
            </div>
            {!isLocked && (
              <div className="flex flex-col items-end gap-2">
                <CompleteQuestButton
                  questId={quest.id}
                  completed={isCompleted}
                  isDaily={quest.isDaily}
                  size="lg"
                />
              </div>
            )}
          </div>
          {quest.completedAt && (
            <div className="mt-4 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
              Completed{" "}
              <span className="font-body text-sm text-foreground normal-case tracking-normal">
                {relativeTime(quest.completedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {quest.completions.length > 0 && (
        <div>
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-3">
            Recent Completions
          </h2>
          <div className="space-y-2">
            {quest.completions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between norse-card p-3 text-sm"
              >
                <span className="font-body text-foreground">
                  {relativeTime(c.completedAt)}
                </span>
                <span className="text-gold font-display">+{c.xpAwarded} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
