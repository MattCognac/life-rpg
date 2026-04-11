import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import { QuestCard } from "@/components/quests/quest-card";
import { formatNumber } from "@/lib/utils";
import { SkillForm } from "@/components/skills/skill-form";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Sword;
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getAuthUser } = await import("@/lib/auth");
  const userId = await getAuthUser();
  const skill = await db.skill.findFirst({
    where: { id, userId },
    include: {
      quests: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!skill) notFound();

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(skill.totalXp);
  const Icon = getIcon(skill.icon);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/skills" />

      <div className="norse-card p-6">
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 flex items-center justify-center border-2 flex-shrink-0"
            style={{
              borderColor: `${skill.color}CC`,
              backgroundColor: `${skill.color}15`,
              boxShadow: `0 0 30px ${skill.color}40`,
            }}
          >
            <Icon className="w-10 h-10" style={{ color: skill.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="font-display text-3xl tracking-widest uppercase"
                  style={{ color: skill.color }}
                >
                  {skill.name}
                </h1>
                <div className="text-xs font-body tracking-widest uppercase text-muted-foreground mt-1">
                  Level {level} • {formatNumber(skill.totalXp)} Total XP
                </div>
              </div>
              <SkillForm
                skill={skill}
                trigger={<Button variant="ghost" size="sm">Edit</Button>}
              />
            </div>
            <div className="mt-4">
              <XpBar
                current={currentLevelXp}
                max={xpForNextLevel}
                color={skill.color}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg tracking-widest uppercase text-foreground mb-3">
          Quests
        </h2>
        {skill.quests.length === 0 ? (
          <div className="norse-card p-6 text-center text-sm text-muted-foreground">
            No quests yet for this skill.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skill.quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={{ ...quest, skill }}
                href={`/quests/${quest.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
