"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ChainCard } from "@/components/chains/chain-card";

interface ChainData {
  id: string;
  name: string;
  description: string;
  tier?: string;
  starred: boolean;
  quests: Array<{ status: string }>;
}

interface Props {
  chains: ChainData[];
}

export function CompletedChainsSection({ chains }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (chains.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 mb-4 group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
          Completed Chains
        </h2>
        <span className="text-xs text-muted-foreground font-body">
          ({chains.length})
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chains.map((chain) => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      )}
    </div>
  );
}
