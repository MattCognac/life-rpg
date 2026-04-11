import Link from "next/link";
import { Link2, Check } from "lucide-react";

interface Props {
  chain: {
    id: string;
    name: string;
    description: string;
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

        <div className="font-display text-base tracking-wider uppercase text-foreground mb-1">
          {chain.name}
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
