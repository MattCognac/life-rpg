"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="norse-card p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.4), transparent 60%)",
        }}
      />
      <div className="relative space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-widest text-gradient-gold uppercase">
            Life RPG
          </h1>
          <p className="text-xs font-display tracking-[0.3em] text-muted-foreground uppercase mt-2">
            Return to the Realm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 bg-input border border-border text-foreground text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="adventurer@realm.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-input border border-border text-foreground text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive font-body">{error}</div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-norse w-full"
          >
            {isPending ? "Entering..." : "Enter the Realm"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm font-body text-muted-foreground">
            New adventurer?{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Begin your journey
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
