"use client";

import { useEffect, useState } from "react";

/**
 * Subtle Norse-themed screen flash shown on quest completion.
 *
 * A radial gold pulse fades in from the center of the screen and dissolves.
 * No particles, no confetti — just a brief ambient acknowledgment that
 * something good happened. Pairs with the toast for readable feedback.
 *
 * Global event bus pattern (like level-up-modal.tsx) so any component can
 * trigger it without prop drilling or context.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

export function triggerQuestCompleteFlash() {
  listeners.forEach((l) => l());
}

export function QuestCompleteFlash() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const listener: Listener = () => {
      setActive(false);
      // Double-RAF to restart the CSS animation on repeated triggers
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setActive(true)),
      );
      setTimeout(() => setActive(false), 1400);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none animate-quest-flash"
      style={{
        background:
          "radial-gradient(circle at center, hsl(var(--gold) / 0.22) 0%, hsl(var(--primary) / 0.08) 30%, transparent 60%)",
      }}
    />
  );
}
