import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { QuestCard } from "@/components/quests/quest-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Swords, Plus } from "lucide-react";

const tabs = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "locked", label: "Locked" },
  { key: "all", label: "All" },
] as const;

export async function QuestsView({ status }: { status?: string }) {
  const userId = await getAuthUser();
  const filter = status ?? "active";

  const quests = await db.quest.findMany({
    where: {
      userId,
      isDaily: false,
      ...(filter === "all" ? {} : { status: filter }),
    },
    include: { skill: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const counts = await db.quest.groupBy({
    by: ["status"],
    _count: true,
    where: { userId, isDaily: false },
  });
  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count])
  );

  return (
    <>
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const count = countMap[tab.key] as number | undefined;
          return (
            <Link
              key={tab.key}
              href={`/quest-log?view=quests&status=${tab.key}`}
              className={`px-4 py-2 font-display text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({count})
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {quests.length === 0 ? (
        <EmptyState
          Icon={Swords}
          title="The Quest Board is Empty"
          description="Every hero's journey begins with a single quest. What will yours be?"
          action={
            <Link href="/quests/new">
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                Create First Quest
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              href={`/quests/${quest.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
