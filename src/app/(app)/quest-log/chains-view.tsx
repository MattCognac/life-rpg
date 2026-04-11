import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ChainCard } from "@/components/chains/chain-card";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Link2, Plus } from "lucide-react";

export async function ChainsView() {
  const userId = await getAuthUser();
  const chains = await db.questChain.findMany({
    where: { userId },
    include: { quests: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {chains.length === 0 ? (
        <EmptyState
          Icon={Link2}
          title="No Chains Forged"
          description="Chains are sequences of quests where completing one unlocks the next. Forge a quest chain from a big goal, or build one from scratch."
          action={
            <div className="flex items-center gap-2">
              <AIChainGenerator />
              <Link href="/chains/new">
                <Button variant="ghost">
                  <Plus className="w-4 h-4" />
                  From Scratch
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chains.map((chain) => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      )}
    </>
  );
}
