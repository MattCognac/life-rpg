"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  UserCircle,
  Trophy,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const questLogPrefixes = ["/quest-log", "/quests", "/chains", "/daily"];

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quest-log", label: "Quest Log", icon: ScrollText },
  { href: "/character", label: "Character", icon: UserCircle },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-border bg-card/60 backdrop-blur-sm z-20">
      <Link href="/" className="block px-6 py-6 border-b border-border">
        <div className="font-display text-2xl tracking-widest text-gradient-gold">
          LIFE RPG
        </div>
        <div className="text-[10px] font-body tracking-[0.3em] text-muted-foreground uppercase mt-1">
          Your Quest Begins
        </div>
      </Link>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/quest-log"
                ? questLogPrefixes.some((p) => pathname.startsWith(p))
                : item.href === "/character"
                  ? pathname.startsWith("/character") || pathname.startsWith("/skills")
                  : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 font-display uppercase tracking-wider text-sm transition-all duration-200 border-l-2",
                active
                  ? "text-primary bg-primary/10 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card-hover border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  active && "drop-shadow-[0_0_4px_hsl(var(--primary))]"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 font-display uppercase tracking-wider text-sm text-muted-foreground hover:text-foreground hover:bg-card-hover border-l-2 border-transparent transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div className="text-[10px] font-body tracking-wider text-muted-foreground uppercase">
          Open Source • MIT
        </div>
      </div>
    </aside>
  );
}
