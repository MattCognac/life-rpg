"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toaster";
import { Mail } from "lucide-react";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newEmail === currentEmail) {
      setError("That's already your email");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNewEmail("");
      toast({
        type: "default",
        title: "Confirmation sent",
        description: "Check your new email inbox to confirm the change",
      });
    });
  };

  return (
    <div className="norse-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-primary" />
        <h2 className="font-display text-lg tracking-widest uppercase">
          Update Email
        </h2>
      </div>

      <p className="text-sm text-muted-foreground font-body mb-4">
        Current email:{" "}
        <span className="text-foreground">{currentEmail}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="new-email">New Email</Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="new@example.com"
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive font-body">{error}</div>
        )}

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Sending..." : "Update Email"}
        </Button>
      </form>
    </div>
  );
}
