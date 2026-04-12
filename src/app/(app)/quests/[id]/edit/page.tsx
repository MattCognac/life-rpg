import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { QuestForm } from "@/components/quests/quest-form";
import { BackButton } from "@/components/ui/back-button";

export const dynamic = "force-dynamic";

export default async function EditQuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getAuthUser();
  const [quest, skills] = await Promise.all([
    db.quest.findFirst({ where: { id, userId } }),
    db.skill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!quest) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref={`/quests/${id}`} />

      <div>
        <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
          Edit Quest
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Adjust the details of your quest.
        </p>
      </div>

      <div className="norse-card p-6">
        <QuestForm
          skills={skills}
          quest={{
            id: quest.id,
            title: quest.title,
            description: quest.description,
            difficulty: quest.difficulty,
            xpReward: quest.xpReward,
            skillId: quest.skillId,
          }}
        />
      </div>
    </div>
  );
}
