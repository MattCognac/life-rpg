"use client";

import {
  LayoutDashboard,
  Swords,
  Sun,
  UserCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptimisticPathname } from "@/lib/use-optimistic-pathname";

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/daily", label: "Dailies", icon: Sun },
  { href: "/character", label: "Hero", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const { pathname, navigate } = useOptimisticPathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-display uppercase tracking-widest transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_4px_hsl(var(--primary))]")} />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
