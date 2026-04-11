"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label: string;
  fallbackHref?: string;
}

export function BackButton({ label, fallbackHref }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (fallbackHref && window.history.length <= 1) {
          router.push(fallbackHref);
        } else {
          router.back();
        }
      }}
    >
      <ArrowLeft className="w-3 h-3" />
      {label}
    </Button>
  );
}
