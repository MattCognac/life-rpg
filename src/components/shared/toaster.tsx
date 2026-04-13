"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Zap, X } from "lucide-react";

type ToastType = "achievement" | "level-up" | "xp" | "default";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  icon?: string;
}

// Global event bus — avoids needing a provider wrapper for such a small API.
type Listener = (toast: Omit<Toast, "id">) => void;
const listeners = new Set<Listener>();

export function toast(t: Omit<Toast, "id">) {
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 5000);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm">
      {toasts.map((t) => {
        const Icon =
          t.type === "achievement" ? Trophy : t.type === "level-up" ? Star : Zap;
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative norse-card clip-rune p-4 pr-10 animate-slide-in-right ember-hover"
            style={{
              borderColor: "hsl(var(--primary) / 0.6)",
              boxShadow: "0 0 30px hsl(var(--primary) / 0.4)",
            }}
          >
            <button
              onClick={() => dismiss(t.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm tracking-wider text-gold uppercase">
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-xs text-foreground mt-0.5">
                    {t.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
