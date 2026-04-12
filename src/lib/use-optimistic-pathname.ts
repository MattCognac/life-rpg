"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Wraps usePathname with optimistic updates so navigation links
 * highlight immediately on click instead of waiting for the server
 * round-trip.
 */
export function useOptimisticPathname() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (pending && pathname === pending) {
      setPending(null);
    }
  }, [pathname, pending]);

  const navigate = useCallback(
    (href: string) => {
      setPending(href);
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startTransition],
  );

  return {
    pathname: pending ?? pathname,
    navigate,
    isPending: pending !== null,
  };
}
