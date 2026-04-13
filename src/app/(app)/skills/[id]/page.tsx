import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import { formatNumber } from "@/lib/utils";
import { SkillForm } from "@/components/skills/skill-form";
import { DeleteSkillButton } from "@/components/skills/delete-skill-button";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getDisciplineBySlug } from "@/lib/disciplines";
import * as LucideIcons from "lucide-react";
import { Plus } from "lucide-react";
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

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(skill.totalXp);
  const Icon = getIcon(skill.icon);

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
                <h1
                  className="font-display text-3xl tracking-widest uppercase"
                  style={{ color: skill.color }}
                >
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
                    icon: skill.icon,
                    color: skill.color,
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
                color={skill.color}
              />
            </div>
          </div>
        </div>
      </div>

      {isTopLevel && (
        <div>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground mb-3">
            Specializations
          </h2>
          <div className="flex flex-wrap gap-4">
            {skill.children.map((child) => {
              const ChildIcon = getIcon(child.icon);
              const childLevel = computeLevel(child.totalXp);
              const pct = childLevel.xpForNextLevel > 0
                ? (childLevel.currentLevelXp / childLevel.xpForNextLevel) * 100
                : 0;
              const circumference = 2 * Math.PI * 34;
              const dashOffset = circumference - (pct / 100) * circumference;
              return (
                <Link
                  key={child.id}
                  href={`/skills/${child.id}`}
                  className="group flex flex-col items-center gap-2 w-24"
                >
                  <div className="relative w-[76px] h-[76px]">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 76 76">
                      <circle
                        cx="38" cy="38" r="34"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="3"
                      />
                      <circle
                        cx="38" cy="38" r="34"
                        fill="none"
                        stroke={child.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div
                      className="absolute inset-[6px] rounded-full border flex items-center justify-center group-hover:scale-105 transition-transform"
                      style={{
                        borderColor: `${child.color}60`,
                        backgroundColor: `${child.color}15`,
                        boxShadow: `0 0 16px ${child.color}25`,
                      }}
                    >
                      <ChildIcon className="w-6 h-6" style={{ color: child.color }} />
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display border"
                      style={{
                        backgroundColor: `${child.color}25`,
                        borderColor: `${child.color}60`,
                        color: child.color,
                      }}
                    >
                      {childLevel.level}
                    </div>
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
