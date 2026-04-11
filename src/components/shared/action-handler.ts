"use client";

import type { ActionResult } from "@/types";
import { toast } from "./toaster";
import { triggerQuestCompleteFlash } from "./quest-complete-flash";
import { showLevelUpModal } from "./level-up-modal";

/**
 * Handle the events returned by a server action:
 * - Fire a subtle gold flash on quest completion
 * - Trigger the level-up modal
 * - Show achievement toasts
 * - Show error toasts
 *
 * Intentionally restrained: no confetti, no particle effects. The RPG feel
 * comes from the level-up modal + toast system + XP-bar shimmer, not from
 * birthday-party visuals.
 */
export function handleActionResult(result: ActionResult<unknown>) {
  if (!result.success) {
    toast({
      type: "default",
      title: "Error",
      description: result.error ?? "Something went wrong",
    });
    return;
  }

  const events = result.events;
  if (!events) return;

  if (events.xpAwarded) {
    triggerQuestCompleteFlash();
    toast({
      type: "xp",
      title: `+${events.xpAwarded} XP`,
      description: events.streakUpdate
        ? `Streak: ${events.streakUpdate.newStreak} day${events.streakUpdate.newStreak > 1 ? "s" : ""}!`
        : undefined,
    });
  }

  if (events.leveledUp) {
    setTimeout(() => {
      showLevelUpModal({
        newLevel: events.leveledUp!.newLevel,
        newTitle: events.leveledUp!.newTitle,
      });
    }, 400);
  }

  if (events.skillLeveledUp) {
    setTimeout(() => {
      toast({
        type: "level-up",
        title: `${events.skillLeveledUp!.skillName} Lv ${events.skillLeveledUp!.newLevel}`,
        description: "Skill level up!",
      });
    }, 600);
  }

  if (events.chainCompleted) {
    setTimeout(() => {
      triggerQuestCompleteFlash();
      toast({
        type: "achievement",
        title: "Chain Complete!",
        description: events.chainCompleted!.chainName,
      });
    }, 800);
  }

  if (events.achievementsUnlocked?.length) {
    events.achievementsUnlocked.forEach((ach, i) => {
      setTimeout(
        () => {
          toast({
            type: "achievement",
            title: `Achievement: ${ach.name}`,
            description: ach.description,
          });
        },
        1000 + i * 700,
      );
    });
  }
}
