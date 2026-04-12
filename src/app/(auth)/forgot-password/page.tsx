"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setEmailSent(true);
    });
  };

  if (emailSent) {
    return (
      <div className="norse-card p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.4), transparent 60%)",
          }}
        />
        <div className="relative space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-widest text-gradient-gold uppercase">
              Check Your Email
            </h2>
            <p className="text-sm text-muted-foreground font-body mt-3 leading-relaxed">
              If an account exists for{" "}
              <span className="text-foreground font-medium">{email}</span>,
              we&apos;ve sent a password reset link.
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground/70 font-body">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Button variant="ghost" asChild>
              <Link href="/login">Return to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            Reset Your Password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="adventurer@realm.com"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive font-body">{error}</div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm font-body text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Return to the realm
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
