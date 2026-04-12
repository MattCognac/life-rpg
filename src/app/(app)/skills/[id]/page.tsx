import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import { QuestCard } from "@/components/quests/quest-card";
import { SkillCard } from "@/components/skills/skill-card";
import { formatNumber } from "@/lib/utils";
import { SkillForm } from "@/components/skills/skill-form";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getRealmBySlug } from "@/lib/realms";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

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
      children: {
        include: {
          quests: { select: { id: true } },
        },
        orderBy: { totalXp: "desc" },
      },
      parent: { select: { id: true, name: true, realm: true } },
    },
  });

  if (!skill) notFound();

  const isDiscipline = !skill.parentId;
  const realm = isDiscipline
    ? getRealmBySlug(skill.realm ?? "life")
    : skill.parent?.realm
      ? getRealmBySlug(skill.parent.realm)
      : null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(skill.totalXp);
  const Icon = getIcon(skill.icon);

  const allQuests = isDiscipline
    ? [
        ...skill.quests,
        ...skill.children.flatMap((child) =>
          child.quests.map((q) => ({ ...q, _childName: child.name }))
        ),
      ]
    : skill.quests;

  const allQuestsFull = isDiscipline
    ? await db.quest.findMany({
        where: {
          userId,
          skillId: {
            in: [skill.id, ...skill.children.map((c) => c.id)],
          },
        },
        include: { skill: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      })
    : skill.quests.map((q) => ({ ...q, skill }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
                {realm && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[10px] font-display uppercase tracking-widest"
                      style={{ color: realm.color }}
                    >
                      {realm.name}
                    </span>
                    {!isDiscipline && skill.parent && (
                      <>
                        <span className="text-[10px] text-muted-foreground">&rsaquo;</span>
                        <Link
                          href={`/skills/${skill.parent.id}`}
                          className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {skill.parent.name}
                        </Link>
                      </>
                    )}
                  </div>
                )}
                <h1
                  className="font-display text-3xl tracking-widest uppercase"
                  style={{ color: skill.color }}
                >
                  {skill.name}
                </h1>
                <div className="text-xs font-body tracking-widest uppercase text-muted-foreground mt-1">
                  {isDiscipline ? "Discipline" : "Sub-skill"} &bull; Level {level} &bull; {formatNumber(skill.totalXp)} Total XP
                </div>
              </div>
              <SkillForm
                skill={{
                  id: skill.id,
                  name: skill.name,
                  icon: skill.icon,
                  color: skill.color,
                  realm: skill.realm,
                  parentId: skill.parentId,
                }}
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

      {isDiscipline && skill.children.length > 0 && (
        <div>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground mb-3">
            Sub-skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {skill.children.map((child) => (
              <SkillCard
                key={child.id}
                skill={child}
                href={`/skills/${child.id}`}
                parentName={skill.name}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg tracking-widest uppercase text-foreground mb-3">
          Quests
        </h2>
        {allQuestsFull.length === 0 ? (
          <div className="norse-card p-6 text-center text-sm text-muted-foreground">
            No quests yet for this {isDiscipline ? "discipline" : "sub-skill"}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allQuestsFull.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                href={`/quests/${quest.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
