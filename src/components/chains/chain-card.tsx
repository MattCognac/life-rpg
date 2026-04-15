import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getChainTier } from "@/lib/disciplines";
import { ChainStarButton } from "@/components/chains/chain-star-button";
import { cn } from "@/lib/utils";

interface Props {
  chain: {
    id: string;
    name: string;
    description: string;
    tier?: string;
    starred: boolean;
    quests: Array<{ status: string }>;
  };
}

export function ChainCard({ chain }: Props) {
  const total = chain.quests.length;
  const completed = chain.quests.filter((q) => q.status === "completed").length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = total > 0 && completed === total;
  const tier =
    chain.tier && chain.tier !== "common" ? getChainTier(chain.tier) : null;

  return (
    <div className={cn("relative h-full group", isComplete && "opacity-75")}>
      <Link href={`/chains/${chain.id}`} className="absolute inset-0 z-10" />
      <div className="norse-card p-5 h-full flex flex-col cursor-pointer relative z-20 pointer-events-none [&_button]:pointer-events-auto">
        <div className="flex items-start justify-between gap-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ChainStarButton chainId={chain.id} starred={chain.starred} className="-ml-1 -mt-1 shrink-0" />
            {tier && (
              <Badge
                variant="outline"
                className="text-[8px] px-1.5 py-0 shrink-0"
                style={{ borderColor: tier.color, color: tier.color }}
              >
                {tier.name}
              </Badge>
            )}
          </div>
          <div className="text-right shrink-0">
            {isComplete ? (
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-success" />
                <span className="text-[10px] font-display uppercase tracking-widest text-success">
                  Complete
                </span>
              </div>
            ) : (
              <>
                <div className="font-display text-2xl text-gold leading-none">
                  {completed}/{total}
                </div>
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  Quests
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 gap-1">
          <div className="font-display text-base tracking-wider uppercase text-foreground">
            {chain.name}
          </div>
          {chain.description && (
            <p className="text-xs text-muted-foreground font-body line-clamp-2">
              {chain.description}
            </p>
          )}
        </div>

        <div className="xp-bar mt-4 flex-shrink-0">
          <div
            className={cn("xp-bar-fill", isComplete && "xp-bar-fill-complete")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
