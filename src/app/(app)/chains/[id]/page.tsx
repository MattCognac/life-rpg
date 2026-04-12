import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChainProgress } from "@/components/chains/chain-progress";
import { AddQuestToChain } from "@/components/chains/add-quest-to-chain";
import { ChainMenu } from "@/components/chains/chain-menu";
import { BackButton } from "@/components/ui/back-button";
import { Link2, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getAuthUser } = await import("@/lib/auth");
  const userId = await getAuthUser();
  const [chain, skills] = await Promise.all([
    db.questChain.findFirst({
      where: { id, userId },
      include: {
        quests: { orderBy: { chainOrder: "asc" } },
      },
    }),
    db.skill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!chain) notFound();

  const completed = chain.quests.filter((q) => q.status === "completed").length;
  const total = chain.quests.length;
  const isComplete = total > 0 && completed === total;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/chains" />

      <div className="norse-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center border-2 border-primary bg-primary/10 flex-shrink-0">
            {isComplete ? (
              <Check className="w-6 h-6 text-success" />
            ) : (
              <Link2 className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-gradient-gold w-fit">
                {chain.name}
              </h1>
              <ChainMenu
                id={chain.id}
                name={chain.name}
                questCount={total}
                completedCount={completed}
              />
            </div>
            {chain.description && (
              <p className="text-sm text-muted-foreground font-body mt-2">
                {chain.description}
              </p>
            )}
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-3">
              Progress: {completed}/{total} quests
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
            Quest Path
          </h2>
          <AddQuestToChain
            chainId={chain.id}
            nextOrder={chain.quests.length}
            skills={skills}
            questNames={chain.quests.map((q) => q.title)}
          />
        </div>

        {chain.quests.length === 0 ? (
          <div className="norse-card p-8 text-center text-sm text-muted-foreground">
            No quests in this chain yet. Add the first step to begin.
          </div>
        ) : (
          <ChainProgress quests={chain.quests} />
        )}
      </div>
    </div>
  );
}
