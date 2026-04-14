"use client";

import { useTransition, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { toggleChainStar } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  chainId: string;
  starred: boolean;
  className?: string;
  /** Bare icon — no padded ghost button; for tight rows (e.g. dashboard chain line). */
  inline?: boolean;
}

export function ChainStarButton({ chainId, starred, className, inline }: Props) {
  const [pending, startTransition] = useTransition();

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleChainStar(chainId);
      handleActionResult(result);
    });
  };

  const ariaLabel = starred
    ? "Remove from dashboard priority"
    : "Prioritize on dashboard";

  if (inline) {
    return (
      <button
        type="button"
        disabled={pending}
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(
          "inline-flex size-3 shrink-0 items-center justify-center rounded-sm border-0 bg-transparent p-0",
          "text-muted-foreground shadow-none outline-offset-1",
          "hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-40",
          starred && "text-gold",
          className
        )}
      >
        <Star
          className={cn("size-2.5", starred && "fill-amber-400 text-amber-400")}
          strokeWidth={2}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground hover:text-gold shrink-0",
        starred && "text-gold",
        className
      )}
      disabled={pending}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Star className={cn("w-4 h-4", starred && "fill-amber-400 text-amber-400")} />
    </Button>
  );
}
