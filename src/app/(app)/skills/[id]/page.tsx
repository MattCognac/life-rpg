import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import { formatNumber } from "@/lib/utils";
import { SkillForm } from "@/components/skills/skill-form";
import { DeleteSkillButton } from "@/components/skills/delete-skill-button";
import { ReparentSkillSelect } from "@/components/skills/reparent-skill-select";
import { PromoteSkillButton } from "@/components/skills/promote-skill-button";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getDisciplineBySlug } from "@/lib/disciplines";
import { LevelRing } from "@/components/shared/level-ring";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      parent: { select: { id: true, name: true, discipline: true } },
    },
  });

  if (!skill) notFound();

  const isTopLevel = !skill.parentId;
  const discipline = isTopLevel
    ? getDisciplineBySlug(skill.discipline ?? "life")
    : skill.parent?.discipline
      ? getDisciplineBySlug(skill.parent.discipline)
      : null;

  const { level, currentLevelXp, xpForNextLevel, progress } = computeLevel(skill.totalXp);

  const otherTopLevelSkills = isTopLevel && skill.children.length === 0
    ? await db.skill.findMany({
        where: { userId, parentId: null, id: { not: skill.id } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const totalQuestCount = await db.quest.count({
    where: {
      userId,
      skillId: isTopLevel
        ? { in: [skill.id, ...skill.children.map((c) => c.id)] }
        : skill.id,
    },
  });
  const specCount = isTopLevel ? skill.children.length : 0;
  const deleteRedirect = isTopLevel
    ? "/character"
    : `/skills/${skill.parentId}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/character" />

      <div className="norse-card p-6">
        <div className="flex items-start gap-5">
          <LevelRing level={level} progress={progress} size="lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                {discipline && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[10px] font-display uppercase tracking-widest"
                      style={{ color: discipline.color }}
                    >
                      {discipline.name}
                    </span>
                    {!isTopLevel && skill.parent && (
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
                <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
                  {skill.name}
                </h1>
                <div className="text-xs font-body tracking-widest uppercase text-muted-foreground mt-1">
                  {isTopLevel ? "Skill" : "Specialization"} &bull; Level {level} &bull; {formatNumber(skill.totalXp)} Total XP
                </div>
              </div>
              <div className="flex items-center gap-1">
                <SkillForm
                  skill={{
                    id: skill.id,
                    name: skill.name,
                    discipline: skill.discipline,
                    parentId: skill.parentId,
                  }}
                  trigger={<Button variant="ghost" size="sm">Edit</Button>}
                />
                <DeleteSkillButton
                  skillId={skill.id}
                  skillName={skill.name}
                  isSpecialization={!isTopLevel}
                  specCount={specCount}
                  questCount={totalQuestCount}
                  redirectTo={deleteRedirect}
                />
              </div>
            </div>
            <div className="mt-4">
              <XpBar
                current={currentLevelXp}
                max={xpForNextLevel}
              />
            </div>
          </div>
        </div>
      </div>

      {isTopLevel && skill.children.length === 0 && otherTopLevelSkills.length > 0 && (
        <ReparentSkillSelect skillId={skill.id} targets={otherTopLevelSkills} />
      )}

      {!isTopLevel && (
        <PromoteSkillButton skillId={skill.id} />
      )}

      {isTopLevel && (
        <div>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground mb-3">
            Specializations
          </h2>
          <div className="flex flex-wrap gap-4">
            {skill.children.map((child) => {
              const childLevel = computeLevel(child.totalXp);
              return (
                <Link
                  key={child.id}
                  href={`/skills/${child.id}`}
                  className="group flex flex-col items-center gap-2 w-24"
                >
                  <div className="group-hover:scale-105 transition-transform">
                    <LevelRing
                      level={childLevel.level}
                      progress={childLevel.progress}
                      size="md"
                    />
                  </div>
                  <span className="text-[10px] font-display uppercase tracking-widest text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                    {child.name}
                  </span>
                </Link>
              );
            })}
            <SkillForm
              addSpecTo={{
                discipline: (skill.discipline ?? "life") as import("@/lib/disciplines").DisciplineSlug,
                skillName: skill.name,
              }}
              trigger={
                <button
                  type="button"
                  className="group flex flex-col items-center gap-2 w-24"
                >
                  <div className="relative w-[76px] h-[76px]">
                    <div className="absolute inset-[6px] rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-muted-foreground/60 group-hover:bg-muted-foreground/10 transition-all">
                      <Plus className="w-6 h-6 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </button>
              }
            />
          </div>
        </div>
      )}

    </div>
  );
}
