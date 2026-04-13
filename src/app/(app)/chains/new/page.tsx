"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { createChain } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { CHAIN_TIERS } from "@/lib/disciplines";
import { cn } from "@/lib/utils";

export default function NewChainPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("common");

  const onSubmit = () => {
    startTransition(async () => {
      const result = await createChain({ name, description, tier });
      handleActionResult(result);
      if (result.success && result.data) {
        router.push(`/chains/${result.data.id}`);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/chains" />

      <div>
        <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
          New Chain
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Forge a new saga of linked quests.
        </p>
      </div>

      <div className="norse-card p-6 space-y-5">
        <div>
          <Label htmlFor="name">Chain Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Couch to 5K, Learn Guitar Basics"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this chain about?"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Tier</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {CHAIN_TIERS.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTier(t.slug)}
                className={cn(
                  "py-2.5 border flex flex-col items-center gap-1 transition-all",
                  tier === t.slug
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span
                  className="text-[9px] font-display uppercase tracking-widest"
                  style={{ color: tier === t.slug ? t.color : undefined }}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Creating..." : "Create Chain"}
          </Button>
        </div>
      </div>
    </div>
  );
}
