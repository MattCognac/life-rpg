import {
  Shield,
  Scroll,
  Sparkles,
  Target,
  Sun,
  Map,
} from "lucide-react";

export type TutorialStep = {
  id: string;
  target: string | null;
  title: string;
  description: string;
  icon: React.ReactNode;
  tooltipPosition: "below" | "right" | "left" | "center";
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to the Realm",
    description:
      "Life RPG turns your real-life goals into quests. Complete them to earn XP, level up your character, and unlock achievements. Let's show you around.",
    icon: <Shield className="w-8 h-8" />,
    tooltipPosition: "center",
  },
  {
    id: "hero",
    target: '[data-tutorial="hero"]',
    title: "Your Hero",
    description:
      "This is your character. Your level badge, title, XP bar, and key stats all live here. Complete quests to earn XP and watch your hero grow stronger.",
    icon: <Shield className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "quests",
    target: '[data-tutorial="quests"]',
    title: "Active Quests",
    description:
      "Your active quests are shown here with chain progress. Create quests manually or use Odin AI to generate a full quest chain from any goal.",
    icon: <Scroll className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "dailies",
    target: '[data-tutorial="dailies"]',
    title: "Dailies",
    description:
      "Dailies are recurring quests you can complete every day. Build streaks to earn bonus XP and stay consistent with your habits.",
    icon: <Sun className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "skills",
    target: '[data-tutorial="skills"]',
    title: "Realm Mastery",
    description:
      "Your power is split across 6 realms — Body, Mind, Spirit, Nature, Craft, and Life. Each realm contains disciplines that level up as you complete related quests.",
    icon: <Target className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "navigation",
    target: '[data-tutorial="sidebar-nav"]',
    title: "Explore the Realm",
    description:
      "Use the sidebar to navigate between your Dashboard, Quests, Chains, Dailies, Character page, and Achievements. Each section gives you a deeper view of your journey.",
    icon: <Map className="w-6 h-6" />,
    tooltipPosition: "right",
  },
  {
    id: "forge-ai",
    target: '[data-tutorial="forge-ai"]',
    title: "Create Your First Goal",
    description:
      "Ready to begin? Use Odin AI to break any goal into a step-by-step quest chain, or create quests manually from scratch anytime. This shit's powerful as fuck. Seriously, try it.",
    icon: <Sparkles className="w-6 h-6" />,
    tooltipPosition: "below",
  },
];
