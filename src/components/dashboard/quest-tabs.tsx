"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestCard } from "@/components/quests/quest-card";
import { ChainCard } from "@/components/chains/chain-card";
import { DailyQuestCard } from "@/components/daily/daily-quest-card";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { Button } from "@/components/ui/button";
import { Sun, Link2, Swords, Plus, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "quests", label: "Quests", Icon: Swords },
  { key: "chains", label: "Chains", Icon: Link2 },
  { key: "daily", label: "Dailies", Icon: Sun },
] as const;

type Tab = (typeof tabs)[number]["key"];

interface Daily {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  xpReward: number;
  skill?: { id: string; name: string; color: string } | null;
}

interface DailyWithMeta {
  quest: Daily;
  streak: { currentStreak: number; longestStreak: number } | null;
  completedToday: boolean;
}

interface Chain {
  id: string;
  name: string;
  description: string;
  quests: Array<{ status: string }>;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  xpReward: number;
  status: string;
  isDaily: boolean;
  skill?: { id: string; name: string; color: string } | null;
}

interface Props {
  dailies: DailyWithMeta[];
  chains: Chain[];
  quests: Quest[];
}

function EmptyCta() {
  return (
    <div className="norse-card p-8 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">
        Nothing here yet. Start your journey!
      </p>
      <div className="flex gap-2">
        <Link href="/quests/new">
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Quest
          </Button>
        </Link>
        <AIChainGenerator>
          <Button>
            <Sparkles className="w-4 h-4" />
            Forge with Odin AI
          </Button>
        </AIChainGenerator>
      </div>
    </div>
  );
}

export function QuestTabs({ dailies, chains, quests }: Props) {
  const [active, setActive] = useState<Tab>("quests");

  const viewAllHref =
    active === "daily" ? "/daily" :
    active === "chains" ? "/chains" :
    "/quests";

  return (
    <div className="norse-card p-5 w-full flex flex-col">
      <div className="flex items-center justify-between pb-5 border-b border-border/50">
        <div className="flex gap-2">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs uppercase tracking-widest transition-all whitespace-nowrap border",
                active === key
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-card/60 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", active === key && "drop-shadow-[0_0_4px_hsl(var(--primary))]")} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quests/new">
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
              New Quest
            </Button>
          </Link>
          <AIChainGenerator>
            <Button size="sm">
              <Sparkles className="w-4 h-4" />
              Forge with Odin AI
            </Button>
          </AIChainGenerator>
        </div>
      </div>

      <div className="flex-1 pt-5">
        {active === "daily" && (
          dailies.length === 0 ? (
            <EmptyCta />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dailies.map((d) => (
                <DailyQuestCard
                  key={d.quest.id}
                  quest={d.quest}
                  streak={d.streak}
                  completedToday={d.completedToday}
                />
              ))}
            </div>
          )
        )}

        {active === "quests" && (
          quests.length === 0 ? (
            <EmptyCta />
          ) : (
            <div>
              {quests.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  href={`/quests/${q.id}`}
                  compact
                  variant="row"
                />
              ))}
            </div>
          )
        )}

        {active === "chains" && (
          chains.length === 0 ? (
            <EmptyCta />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chains.map((c) => (
                <ChainCard key={c.id} chain={c} />
              ))}
            </div>
          )
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Link
          href={viewAllHref}
          className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
