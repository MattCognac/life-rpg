"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  completeQuest,
  uncompleteQuest,
  undoDailyCompletion,
} from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Check, Undo2 } from "lucide-react";

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

  if (completed) {
    return (
      <Button
        variant="outline"
        size={iconOnly ? "icon" : size}
        onClick={onClick}
        disabled={isPending || disabled}
      >
        <Undo2 className="w-4 h-4" />
        {!iconOnly && "Undo"}
      </Button>
    );
  }

  return (
    <Button size={iconOnly ? "icon" : size} onClick={onClick} disabled={isPending || disabled}>
      <Check className="w-4 h-4" />
      {!iconOnly && (isPending ? "Completing..." : "Complete")}
    </Button>
  );
}
