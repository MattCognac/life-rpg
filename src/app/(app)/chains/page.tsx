import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ChainCard } from "@/components/chains/chain-card";
import { ChainForm } from "@/components/chains/chain-form";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { CompletedChainsSection } from "@/components/chains/completed-chains-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChainsPage() {
  const userId = await getAuthUser();
  const chains = await db.questChain.findMany({
    where: { userId },
    include: { quests: { select: { status: true } } },
    orderBy: [{ starred: "desc" }, { starredAt: "desc" }, { createdAt: "desc" }],
  });

  const activeChains = chains.filter(
    (c) => c.quests.length === 0 || c.quests.some((q) => q.status !== "completed")
  );
  const completedChains = chains.filter(
    (c) => c.quests.length > 0 && c.quests.every((q) => q.status === "completed")
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Quest Chains
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Sagas of connected quests. Complete one to unlock the next.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChainForm />
          <AIChainGenerator />
        </div>
      </div>

      {chains.length === 0 ? (
        <EmptyState
          Icon={Link2}
          title="No Chains Forged"
          description="Chains are sequences of quests where completing one unlocks the next. Forge a quest chain from a big goal, or build one from scratch."
          action={
            <div className="flex items-center gap-2">
              <ChainForm />
              <AIChainGenerator />
            </div>
          }
        />
      ) : (
        <>
          {activeChains.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeChains.map((chain) => (
                <ChainCard key={chain.id} chain={chain} />
              ))}
            </div>
          )}

          <CompletedChainsSection chains={completedChains} />
        </>
      )}
    </div>
  );
}
