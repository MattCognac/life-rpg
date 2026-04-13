import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { QuestForm } from "@/components/quests/quest-form";
import { BackButton } from "@/components/ui/back-button";

export const dynamic = "force-dynamic";

export default async function NewDailyPage() {
  const userId = await getAuthUser();
  const skills = await db.skill.findMany({
    where: { userId, parentId: null },
    include: { children: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/daily" />

      <div>
        <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
          New Daily
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Forge a daily ritual to build your streak.
        </p>
      </div>

      <div className="norse-card p-6">
        <QuestForm skills={skills} defaultIsDaily />
      </div>
    </div>
  );
}
