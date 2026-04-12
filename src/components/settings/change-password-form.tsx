"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toaster";
import { KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      toast({ type: "default", title: "Password updated" });
    });
  };

  return (
    <div className="norse-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-4 h-4 text-primary" />
        <h2 className="font-display text-lg tracking-widest uppercase">
          Change Password
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
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
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive font-body">{error}</div>
        )}

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
