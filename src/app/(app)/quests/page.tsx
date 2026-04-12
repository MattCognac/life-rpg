import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { QuestCard } from "@/components/quests/quest-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Swords, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const userId = await getAuthUser();
  const { status } = await searchParams;
  const filter = status ?? "active";

  const [quests, counts] = await Promise.all([
    db.quest.findMany({
      where: {
        userId,
        isDaily: false,
        ...(filter === "all" ? {} : { status: filter }),
      },
      include: { skill: { include: { parent: { select: { name: true } } } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.quest.groupBy({
      by: ["status"],
      _count: true,
      where: { userId, isDaily: false },
    }),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  const tabs = [
    { key: "active", label: "Active", count: countMap["active"] ?? 0 },
    { key: "completed", label: "Completed", count: countMap["completed"] ?? 0 },
    { key: "locked", label: "Locked", count: countMap["locked"] ?? 0 },
    { key: "all", label: "All" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Quest Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Adventures await those bold enough to seek them.
          </p>
        </div>
        <Link href="/quests/new">
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Quest
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/quests?status=${tab.key}`}
            className={`px-4 py-2 font-display text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
            )}
          </Link>
        ))}
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
    </div>
  );
}
