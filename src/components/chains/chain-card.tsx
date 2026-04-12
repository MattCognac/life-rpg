import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getChainTier } from "@/lib/realms";
import { Link2, Check } from "lucide-react";

interface Props {
  chain: {
    id: string;
    name: string;
    description: string;
    tier?: string;
    quests: Array<{ status: string }>;
  };
}

export function ChainCard({ chain }: Props) {
  const total = chain.quests.length;
  const completed = chain.quests.filter((q) => q.status === "completed").length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = total > 0 && completed === total;

  return (
    <Link href={`/chains/${chain.id}`}>
      <div className="norse-card p-5 ember-hover cursor-pointer h-full group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 flex items-center justify-center border border-primary/40 bg-primary/10">
            {isComplete ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Link2 className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="text-right">
            <div className="font-display text-2xl text-gold">
              {completed}/{total}
            </div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
              Quests
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <div className="font-display text-base tracking-wider uppercase text-foreground">
            {chain.name}
          </div>
          {chain.tier && chain.tier !== "common" && (() => {
            const tier = getChainTier(chain.tier);
            return tier ? (
              <Badge
                variant="outline"
                className="text-[8px] px-1.5 py-0"
                style={{ borderColor: tier.color, color: tier.color }}
              >
                {tier.name}
              </Badge>
            ) : null;
          })()}
        </div>
        {chain.description && (
          <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-3">
            {chain.description}
          </p>
        )}

        <div className="xp-bar mt-4">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
