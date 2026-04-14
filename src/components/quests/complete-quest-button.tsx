"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  completeQuest,
  uncompleteQuest,
  undoDailyCompletion,
} from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";
import { Check, Undo2 } from "lucide-react";

const compactCompleteCls =
  "h-8 min-h-8 rounded-md border border-primary/45 bg-gradient-to-b from-primary/90 to-primary/75 text-primary-foreground shadow-[0_0_10px_rgba(221,97,25,0.14)] hover:from-primary hover:to-primary/90 hover:border-primary/70 text-[10px] px-3";
const compactCompleteIconCls =
  "h-8 w-8 min-h-8 min-w-8 rounded-md border border-primary/45 bg-gradient-to-b from-primary/90 to-primary/75 text-primary-foreground shadow-[0_0_10px_rgba(221,97,25,0.14)] hover:from-primary hover:to-primary/90 p-0";
const compactUndoCls =
  "h-8 min-h-8 rounded-md border border-border/70 bg-card/90 text-muted-foreground hover:text-foreground hover:border-primary/35 hover:bg-muted/40 text-[10px] px-2.5";
const compactUndoIconCls =
  "h-8 w-8 min-h-8 min-w-8 rounded-md border border-border/70 bg-card/90 text-muted-foreground hover:text-foreground hover:border-primary/35 hover:bg-muted/40 p-0";

interface Props {
  questId: string;
  completed?: boolean;
  isDaily?: boolean;
  size?: "sm" | "lg" | "default" | "icon";
  disabled?: boolean;
}

export function CompleteQuestButton({
  questId,
  completed,
  isDaily,
  size = "lg",
  disabled,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      let result;
      if (completed) {
        result = isDaily
          ? await undoDailyCompletion(questId)
          : await uncompleteQuest(questId);
      } else {
        result = await completeQuest(questId);
      }
      handleActionResult(result);
    });
  };

  const iconOnly = size === "icon";
  const compact = size === "sm" || size === "icon";

  if (completed) {
    return (
      <Button
        variant="outline"
        size={iconOnly ? "icon" : size}
        className={cn(
          compact &&
            (iconOnly ? compactUndoIconCls : compactUndoCls)
        )}
        onClick={onClick}
        disabled={isPending || disabled}
      >
        <Undo2 className="w-3.5 h-3.5" />
        {!iconOnly && "Undo"}
      </Button>
    );
  }

  return (
    <Button
      size={iconOnly ? "icon" : size}
      className={cn(
        compact && (iconOnly ? compactCompleteIconCls : compactCompleteCls)
      )}
      onClick={onClick}
      disabled={isPending || disabled}
    >
      <Check className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
      {!iconOnly && (isPending ? "Completing..." : "Complete")}
    </Button>
  );
}
