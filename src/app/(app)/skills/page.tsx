import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { SkillCard } from "@/components/skills/skill-card";
import { SkillForm } from "@/components/skills/skill-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const userId = await getAuthUser();
  const skills = await db.skill.findMany({
    where: { userId },
    orderBy: { totalXp: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Skills
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Master the disciplines of your craft.
          </p>
        </div>
        <SkillForm />
      </div>

      {skills.length === 0 ? (
        <EmptyState
          Icon={Sparkles}
          title="No Skills Yet"
          description="Forge your first skill to begin tracking your mastery. Skills gain XP when you complete quests tagged to them."
          action={
            <SkillForm
              trigger={
                <Button variant="ghost">
                  <Plus className="w-4 h-4" />
                  Forge First Skill
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} href={`/skills/${skill.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
