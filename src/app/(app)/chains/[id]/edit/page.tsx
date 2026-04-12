import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { BackButton } from "@/components/ui/back-button";
import { ChainEditForm } from "@/components/chains/chain-edit-form";
import { AddQuestToChain } from "@/components/chains/add-quest-to-chain";

export const dynamic = "force-dynamic";

export default async function EditChainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getAuthUser();
  const [chain, skills] = await Promise.all([
    db.questChain.findFirst({
      where: { id, userId },
      include: {
        quests: { orderBy: { chainOrder: "asc" } },
      },
    }),
    db.skill.findMany({
      where: { userId, parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!chain) notFound();

  const skillProps = skills.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref={`/chains/${id}`} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Edit Chain
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Manage quests and details for this chain.
          </p>
        </div>
        <AddQuestToChain
          chainId={chain.id}
          nextOrder={chain.quests.length}
          skills={skillProps}
          questNames={chain.quests.map((q) => q.title)}
        />
      </div>

      <ChainEditForm
        chain={{
          id: chain.id,
          name: chain.name,
          description: chain.description,
        }}
        quests={chain.quests.map((q) => ({
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          xpReward: q.xpReward,
          status: q.status,
          chainOrder: q.chainOrder,
        }))}
        skills={skillProps}
      />
    </div>
  );
}
