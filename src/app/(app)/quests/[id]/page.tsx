import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";
import { DeleteQuestButton } from "@/components/quests/delete-quest-button";
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
      skill: true,
      chain: true,
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
      <BackButton label="Quests" fallbackHref="/quests" />

      <div className="norse-card p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
                borderColor: `${quest.skill.color}80`,
                color: quest.skill.color,
              }}
            >
              {quest.skill.name}
            </Badge>
          )}
        </div>

        <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-foreground">
          {quest.title}
        </h1>

        {quest.description && (
          <p className="text-sm text-muted-foreground font-body mt-3 whitespace-pre-wrap">
            {quest.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-border">
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
          {quest.completedAt && (
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                Completed
              </div>
              <div className="text-sm font-body text-foreground mt-1">
                {relativeTime(quest.completedAt)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          {!isLocked && (
            <CompleteQuestButton questId={quest.id} completed={isCompleted} />
          )}
          <Link href={`/quests/${quest.id}/edit`}>
            <Button variant="outline" size="lg">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <DeleteQuestButton id={quest.id} redirectTo="/quests" />
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
