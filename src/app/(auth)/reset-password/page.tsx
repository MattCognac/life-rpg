"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
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
            Set New Password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive font-body">{error}</div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
