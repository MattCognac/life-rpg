"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { createChain } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";

export default function NewChainPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const onSubmit = () => {
    startTransition(async () => {
      const result = await createChain({ name, description });
      handleActionResult(result);
      if (result.success && result.data) {
        router.push(`/chains/${result.data.id}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton label="Back" fallbackHref="/chains" />

      <div>
        <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold">
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
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Creating..." : "Create Chain"}
          </Button>
        </div>
      </div>
    </div>
  );
}
