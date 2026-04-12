"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="norse-card p-8 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl tracking-widest text-gradient-gold uppercase">
            Quest Failed
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            Something went wrong. The realm encountered an unexpected obstacle.
          </p>
        </div>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
