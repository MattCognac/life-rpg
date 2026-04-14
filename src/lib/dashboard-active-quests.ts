import { db } from "@/lib/db";

const DASHBOARD_ACTIVE_LIMIT = 5;

const activeQuestInclude = {
  chain: {
    include: { quests: { select: { status: true } } },
  },
} as const;

/** Active non-daily quests for the dashboard: starred chains’ active quests first, then recency. */
export async function getDashboardActiveQuests(userId: string) {
  const starredChains = await db.questChain.findMany({
    where: { userId, starred: true },
    orderBy: { starredAt: "asc" },
    select: { id: true },
  });

  if (starredChains.length === 0) {
    return db.quest.findMany({
      where: { userId, status: "active", isDaily: false },
      include: activeQuestInclude,
      orderBy: { createdAt: "desc" },
      take: DASHBOARD_ACTIVE_LIMIT,
    });
  }

  const chainIds = starredChains.map((c) => c.id);
  const activeInStarredChains = await db.quest.findMany({
    where: {
      userId,
      status: "active",
      isDaily: false,
      chainId: { in: chainIds },
    },
    include: activeQuestInclude,
    orderBy: [{ chainId: "asc" }, { chainOrder: "asc" }],
  });

  const firstPerChain = new Map<string, (typeof activeInStarredChains)[0]>();
  for (const q of activeInStarredChains) {
    if (!q.chainId) continue;
    if (!firstPerChain.has(q.chainId)) {
      firstPerChain.set(q.chainId, q);
    }
  }

  const ordered: typeof activeInStarredChains = [];
  for (const { id: cid } of starredChains) {
    const q = firstPerChain.get(cid);
    if (q) ordered.push(q);
  }

  const used = new Set(ordered.map((q) => q.id));
  const remainingSlots = DASHBOARD_ACTIVE_LIMIT - ordered.length;

  if (remainingSlots <= 0) {
    return ordered.slice(0, DASHBOARD_ACTIVE_LIMIT);
  }

  const rest = await db.quest.findMany({
    where: {
      userId,
      status: "active",
      isDaily: false,
      id: { notIn: [...used] },
    },
    include: activeQuestInclude,
    orderBy: { createdAt: "desc" },
    take: remainingSlots,
  });

  return [...ordered, ...rest];
}
