"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
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
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-widest text-gradient-gold uppercase">
                Account Verified
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-3 leading-relaxed">
                Your account has been confirmed.
                <br />
                You can close this tab and return to Life RPG.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={() => window.close()} className="w-full">
                Close This Tab
              </Button>
              <p className="text-xs text-muted-foreground/70 font-body mt-3">
                If the tab doesn&apos;t close, you can safely close it manually.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
