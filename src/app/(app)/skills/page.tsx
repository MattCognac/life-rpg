import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { SkillCard } from "@/components/skills/skill-card";
import { SkillForm } from "@/components/skills/skill-form";
import { EmptyState } from "@/components/shared/empty-state";
import { REALMS, getRealmBySlug } from "@/lib/realms";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Sword;
}

export default async function SkillsPage() {
  const userId = await getAuthUser();
  const disciplines = await db.skill.findMany({
    where: { userId, parentId: null },
    include: {
      children: {
        orderBy: { totalXp: "desc" },
      },
      _count: { select: { quests: true } },
    },
    orderBy: { totalXp: "desc" },
  });

  const realmGroups = REALMS.map((realm) => ({
    realm,
    disciplines: disciplines.filter((d) => d.realm === realm.slug),
  })).filter((g) => g.disciplines.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Disciplines
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Master the disciplines of your craft.
          </p>
        </div>
        <SkillForm disciplines={disciplines.map((d) => ({ id: d.id, name: d.name, realm: d.realm }))} />
      </div>

      {disciplines.length === 0 ? (
        <EmptyState
          Icon={Sparkles}
          title="No Disciplines Yet"
          description="Forge your first discipline to begin tracking your mastery. Disciplines gain XP when you complete quests tagged to them."
          action={
            <SkillForm
              trigger={
                <Button variant="ghost">
                  <Plus className="w-4 h-4" />
                  Forge First Discipline
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="space-y-6">
          {realmGroups.map(({ realm, disciplines: realmDisciplines }) => {
            const RealmIcon = getIcon(realm.icon);
            return (
              <div key={realm.slug}>
                <div className="flex items-center gap-2 mb-4">
                  <RealmIcon
                    className="w-5 h-5"
                    style={{ color: realm.color }}
                  />
                  <h2
                    className="font-display text-lg tracking-widest uppercase"
                    style={{ color: realm.color }}
                  >
                    {realm.name}
                  </h2>
                  <span className="text-xs text-muted-foreground font-body">
                    {realm.description}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {realmDisciplines.map((discipline) => (
                    <SkillCard
                      key={discipline.id}
                      skill={discipline}
                      href={`/skills/${discipline.id}`}
                      subSkillCount={discipline.children.length}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
