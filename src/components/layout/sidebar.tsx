"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  Link2,
  Sun,
  UserCircle,
  Trophy,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { reopenTutorial } from "@/components/onboarding/tutorial-overlay";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tutorialKey: "nav-dashboard" },
  { type: "section" as const, label: "Quests" },
  { href: "/quests", label: "Quests", icon: Swords, tutorialKey: "nav-quests" },
  { href: "/chains", label: "Chains", icon: Link2, tutorialKey: "nav-chains" },
  { href: "/daily", label: "Dailies", icon: Sun, tutorialKey: "nav-dailies" },
  { type: "section" as const, label: "Profile" },
  { href: "/character", label: "Character", icon: UserCircle, tutorialKey: "nav-character" },
  { href: "/achievements", label: "Achievements", icon: Trophy, tutorialKey: "nav-achievements" },
] as const;

type NavItem = (typeof navItems)[number];

function isLink(item: NavItem): item is Extract<NavItem, { href: string }> {
  return "href" in item;
}

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

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item, i) => {
          if (!isLink(item)) {
            return (
              <div
                key={item.label}
                className={cn(
                  "px-3 pt-5 pb-2 text-[9px] font-display uppercase tracking-[0.3em] text-muted-foreground/60",
                  i === 0 && "pt-2"
                )}
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/character"
                ? pathname.startsWith("/character") || pathname.startsWith("/skills")
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tutorial={item.tutorialKey}
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

      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={reopenTutorial}
          className="w-full flex items-center gap-3 px-3 py-2 font-display uppercase tracking-wider text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tutorial</span>
        </button>
      </div>
    </aside>
  );
}
