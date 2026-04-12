import Link from "next/link";
import { QuestCard } from "@/components/quests/quest-card";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Swords, Plus, Sparkles, ArrowRight, Link2 } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  xpReward: number;
  status: string;
  isDaily: boolean;
  skill?: { id: string; name: string; color: string } | null;
  chain?: {
    id: string;
    name: string;
    quests: Array<{ status: string }>;
  } | null;
}

interface Props {
  quests: Quest[];
}

export function ActiveQuests({ quests }: Props) {
  return (
    <div className="norse-card p-5 w-full flex flex-col">
      <div className="flex items-center justify-between pb-5 border-b border-border/50">
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
          Active Quests
        </h2>
        {quests.length > 0 && (
          <div className="flex items-center gap-2">
            <Link href="/quests/new">
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
                New Quest
              </Button>
            </Link>
            <AIChainGenerator>
              <Button size="sm" data-tutorial="forge-ai">
                <Sparkles className="w-4 h-4" />
                Forge with Odin AI
              </Button>
            </AIChainGenerator>
          </div>
        )}
      </div>

      <div className="flex-1 pt-2">
        {quests.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <Swords className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active quests. Start your journey!
            </p>
            <div className="flex gap-2">
              <Link href="/quests/new">
                <Button variant="ghost">
                  <Plus className="w-4 h-4" />
                  New Quest
                </Button>
              </Link>
              <AIChainGenerator>
                <Button data-tutorial="forge-ai">
                  <Sparkles className="w-4 h-4" />
                  Forge with Odin AI
                </Button>
              </AIChainGenerator>
            </div>
          </div>
        ) : (
          <div>
            {quests.map((quest) => (
              <div key={quest.id}>
                <QuestCard
                  quest={quest}
                  href={`/quests/${quest.id}`}
                  compact
                  variant="row"
                />
                {quest.chain && (
                  <div className="flex items-center gap-1.5 pb-2 pl-1 -mt-1 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    <Link2 className="w-3 h-3" />
                    <Link
                      href={`/chains/${quest.chain.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {quest.chain.name} ({quest.chain.quests.filter((q) => q.status === "completed").length}/{quest.chain.quests.length})
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {quests.length > 0 && (
        <div className="flex justify-end mt-2">
          <Link
            href="/quests"
            className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
