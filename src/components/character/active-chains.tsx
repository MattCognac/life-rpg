import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getChainTier } from "@/lib/disciplines";
import { Link2, ChevronRight } from "lucide-react";

interface ChainSummary {
  id: string;
  name: string;
  tier: string;
  total: number;
  completed: number;
}

interface Props {
  chains: ChainSummary[];
}

export function ActiveChains({ chains }: Props) {
  return (
    <div className="norse-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl tracking-widest uppercase text-foreground">
          Active Chains
        </h2>
        <Link
          href="/chains"
          className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          View All
        </Link>
      </div>

      {chains.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-6">
            <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-body">
              No active quest chains.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {chains.map((chain) => {
            const pct = chain.total > 0 ? (chain.completed / chain.total) * 100 : 0;
            const tier = chain.tier !== "common" ? getChainTier(chain.tier) : null;

            return (
              <Link key={chain.id} href={`/chains/${chain.id}`}>
                <div className="group border border-border hover:border-primary/40 bg-card/50 p-3.5 transition-all">
                  {tier && (
                    <div className="mb-2">
                      <Badge
                        variant="outline"
                        className="text-[8px] px-1.5 py-0"
                        style={{ borderColor: tier.color, color: tier.color }}
                      >
                        {tier.name}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-display text-sm tracking-wider uppercase text-foreground line-clamp-2 min-w-0 flex-1">
                      {chain.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                      <span className="font-display text-xs text-gold tabular-nums">
                        {chain.completed}/{chain.total}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="xp-bar !h-2">
                    <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {chains.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground text-center">
            {chains.length} chain{chains.length === 1 ? "" : "s"} in progress
          </div>
        </div>
      )}
    </div>
  );
}
