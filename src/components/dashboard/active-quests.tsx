import Link from "next/link";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { CompleteQuestButton } from "@/components/quests/complete-quest-button";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Swords, Plus, Sparkles, ArrowRight, Link2, Zap, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <div className="divide-y divide-border/50">
            {quests.map((quest) => (
              <div key={quest.id} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {quest.isDaily && <Sun className="w-3 h-3 text-gold flex-shrink-0" />}
                    {quest.skill && (
                      <Badge
                        variant="outline"
                        className="flex-shrink-0"
                        style={{
                          borderColor: `${quest.skill.color}80`,
                          color: quest.skill.color,
                          backgroundColor: `${quest.skill.color}10`,
                        }}
                      >
                        {quest.skill.name}
                      </Badge>
                    )}
                    <Link
                      href={`/quests/${quest.id}`}
                      className="font-display text-sm tracking-wider uppercase truncate hover:text-primary transition-colors"
                    >
                      {quest.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <DifficultyStars difficulty={quest.difficulty} />
                    <div className="flex items-center gap-1 text-gold font-display">
                      <Zap className="w-3 h-3" />
                      <span className="text-sm">{quest.xpReward}</span>
                    </div>
                    <CompleteQuestButton questId={quest.id} size="icon" />
                  </div>
                </div>
                {quest.chain && (
                  <div className="flex items-center gap-1.5 mt-1 pl-0 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
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
