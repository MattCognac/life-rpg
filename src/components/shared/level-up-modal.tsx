"use client";

import { useEffect, useState } from "react";
import { Shield, Sparkles } from "lucide-react";

interface LevelUpData {
  newLevel: number;
  newTitle: string;
}

// Global event bus for showing the level-up modal
type Listener = (data: LevelUpData) => void;
const listeners = new Set<Listener>();

export function showLevelUpModal(data: LevelUpData) {
  listeners.forEach((l) => l(data));
}

export function LevelUpModal() {
  const [data, setData] = useState<LevelUpData | null>(null);

  useEffect(() => {
    const listener: Listener = (d) => {
      setData(d);
      setTimeout(() => setData(null), 4000);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-fade-in"
      onClick={() => setData(null)}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm pointer-events-auto" />
      <div className="relative animate-level-up-scale">
        <div className="relative flex flex-col items-center gap-4 px-12 py-10 border-2 border-primary bg-card clip-rune"
             style={{
               boxShadow: "0 0 80px hsl(var(--primary) / 0.8), inset 0 0 40px hsl(var(--primary) / 0.2)",
             }}>
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-gold animate-pulse" />
          <Sparkles className="absolute top-4 right-4 w-6 h-6 text-gold animate-pulse" />
          <Sparkles className="absolute bottom-4 left-4 w-6 h-6 text-gold animate-pulse" />
          <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-gold animate-pulse" />

          <div className="font-display text-3xl tracking-widest text-gradient-gold uppercase">
            Level Up!
          </div>
          <div className="relative">
            <Shield className="w-32 h-32 text-primary/20" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-6xl text-gold drop-shadow-[0_0_20px_hsl(var(--gold))]">
              {data.newLevel}
            </div>
          </div>
          <div className="font-display text-lg tracking-wider text-foreground uppercase">
            {data.newTitle}
          </div>
        </div>
      </div>
    </div>
  );
}
