import Link from "next/link";
import { Swords, Link2, Sun, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AIChainGenerator } from "@/components/chains/ai-chain-generator";
import { QuestsView } from "./quests-view";
import { ChainsView } from "./chains-view";
import { DailyView } from "./daily-view";

export const dynamic = "force-dynamic";

const views = [
  { key: "quests", label: "Quests", icon: Swords },
  { key: "chains", label: "Chains", icon: Link2 },
  { key: "daily", label: "Dailies", icon: Sun },
] as const;

type View = (typeof views)[number]["key"];

export default async function QuestLogPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string }>;
}) {
  const { view: rawView, status } = await searchParams;
  const view: View = views.some((v) => v.key === rawView)
    ? (rawView as View)
    : "quests";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold">
            Quest Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Your living record of quests, chains, and daily rituals.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {view === "daily" && (
            <Link href="/quests/new">
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                New Daily
              </Button>
            </Link>
          )}
          {view === "quests" && (
            <Link href="/quests/new">
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                New Quest
              </Button>
            </Link>
          )}
          {view === "chains" && (
            <Link href="/chains/new">
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                New Chain
              </Button>
            </Link>
          )}
          {view === "chains" && <AIChainGenerator />}
        </div>
      </div>

      {/* View selector */}
      <div className="flex gap-2">
        {views.map((v) => {
          const Icon = v.icon;
          const active = view === v.key;
          return (
            <Link
              key={v.key}
              href={`/quest-log?view=${v.key}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs uppercase tracking-widest transition-all whitespace-nowrap border",
                active
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-card/60 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", active && "drop-shadow-[0_0_4px_hsl(var(--primary))]")} />
              {v.label}
            </Link>
          );
        })}
      </div>

      {/* Active view */}
      {view === "daily" && <DailyView />}
      {view === "quests" && <QuestsView status={status} />}
      {view === "chains" && <ChainsView />}
    </div>
  );
}
