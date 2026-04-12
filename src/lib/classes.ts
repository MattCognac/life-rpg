import type { RealmSlug } from "./realms";

export const CHARACTER_CLASSES = {
  warrior: {
    name: "Warrior",
    flavor: "Strength is earned through struggle.",
    description: "+15% XP in Body. Bonus XP on Hard and Legendary quests.",
    icon: "Swords",
    primaryRealm: "body" as RealmSlug,
    secondaryRealm: null,
    perk: "hard_quest_bonus",
  },
  mage: {
    name: "Mage",
    flavor: "Knowledge is the sharpest blade.",
    description: "+15% XP in Mind. Chain completions grant bonus XP.",
    icon: "Sparkles",
    primaryRealm: "mind" as RealmSlug,
    secondaryRealm: null,
    perk: "chain_bonus",
  },
  ranger: {
    name: "Ranger",
    flavor: "There are no shortcuts through the mountains.",
    description: "+15% XP in Nature, +5% in Body. Bonus XP on chain quests.",
    icon: "Compass",
    primaryRealm: "nature" as RealmSlug,
    secondaryRealm: "body" as RealmSlug,
    perk: "chain_quest_bonus",
  },
  monk: {
    name: "Monk",
    flavor: "A thousand strikes begin with stillness.",
    description: "+15% XP in Spirit. Daily streaks survive one missed day.",
    icon: "Leaf",
    primaryRealm: "spirit" as RealmSlug,
    secondaryRealm: null,
    perk: "streak_grace",
  },
  druid: {
    name: "Druid",
    flavor: "All things grow in time.",
    description: "+15% XP in Nature, +5% in Spirit. Daily quests grant bonus XP.",
    icon: "TreePine",
    primaryRealm: "nature" as RealmSlug,
    secondaryRealm: "spirit" as RealmSlug,
    perk: "daily_bonus",
  },
  merchant: {
    name: "Merchant",
    flavor: "Every coin tells a story of cunning.",
    description: "+15% XP in Life. Streak bonuses activate earlier.",
    icon: "Coins",
    primaryRealm: "life" as RealmSlug,
    secondaryRealm: null,
    perk: "early_streak",
  },
  artificer: {
    name: "Artificer",
    flavor: "If it doesn't exist, I'll build it.",
    description: "+15% XP in Craft. Sub-skills level up parent disciplines faster.",
    icon: "Wrench",
    primaryRealm: "craft" as RealmSlug,
    secondaryRealm: null,
    perk: "deep_craft",
  },
  skald: {
    name: "Skald",
    flavor: "The song outlives the sword.",
    description: "+15% XP in Mind, +5% in Craft. Bonus XP on Trivial and Easy quests.",
    icon: "Scroll",
    primaryRealm: "mind" as RealmSlug,
    secondaryRealm: "craft" as RealmSlug,
    perk: "small_quest_bonus",
  },
} as const;

export type CharacterClass = keyof typeof CHARACTER_CLASSES;

export const CLASS_KEYS = Object.keys(CHARACTER_CLASSES) as CharacterClass[];

export type ClassPerk = (typeof CHARACTER_CLASSES)[CharacterClass]["perk"];

const LEGACY_CLASS_MAP: Record<string, CharacterClass> = {
  paladin: "warrior",
  rogue: "ranger",
  artist: "artificer",
};

export function resolveClass(raw: string): CharacterClass {
  if (raw in CHARACTER_CLASSES) return raw as CharacterClass;
  return LEGACY_CLASS_MAP[raw] ?? "warrior";
}

export function getRealmBonus(
  characterClass: CharacterClass,
  realm: string | null | undefined,
): number {
  if (!realm) return 1.0;
  const cls = CHARACTER_CLASSES[characterClass];
  if (cls.primaryRealm === realm) return 1.15;
  if (cls.secondaryRealm === realm) return 1.05;
  return 1.0;
}

export function applyClassXpModifiers(params: {
  baseXp: number;
  characterClass: CharacterClass;
  realm: string | null | undefined;
  difficulty: number;
  isDaily: boolean;
  isChainQuest: boolean;
  skillLevel: number;
}): number {
  const { baseXp, characterClass, realm, difficulty, isDaily, isChainQuest } = params;
  const cls = CHARACTER_CLASSES[characterClass];
  let xp = baseXp;

  xp = Math.round(xp * getRealmBonus(characterClass, realm));

  switch (cls.perk) {
    case "hard_quest_bonus":
      if (difficulty >= 4) xp = Math.round(xp * 1.2);
      break;
    case "small_quest_bonus":
      if (difficulty <= 2) xp = Math.round(xp * 1.2);
      break;
    case "daily_bonus":
      if (isDaily) xp = Math.round(xp * 1.25);
      break;
    case "chain_quest_bonus":
      if (isChainQuest) xp = Math.round(xp * 1.15);
      break;
    case "chain_bonus":
    case "streak_grace":
    case "early_streak":
    case "deep_craft":
      break;
  }

  return xp;
}
