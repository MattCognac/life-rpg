export const CHARACTER_CLASSES = {
  warrior: {
    name: "Warrior",
    flavor: "Strength is earned through struggle.",
    icon: "Swords",
  },
  mage: {
    name: "Mage",
    flavor: "Knowledge is the sharpest blade.",
    icon: "Sparkles",
  },
  ranger: {
    name: "Ranger",
    flavor: "The world is the only teacher that matters.",
    icon: "Compass",
  },
  rogue: {
    name: "Rogue",
    flavor: "Strike fast, strike true.",
    icon: "Zap",
  },
  paladin: {
    name: "Paladin",
    flavor: "My oath is unbreakable.",
    icon: "Shield",
  },
  monk: {
    name: "Monk",
    flavor: "Still water cuts through stone.",
    icon: "Leaf",
  },
  merchant: {
    name: "Merchant",
    flavor: "Every coin tells a story of cunning.",
    icon: "Coins",
  },
  druid: {
    name: "Druid",
    flavor: "All things grow in time.",
    icon: "TreePine",
  },
  artist: {
    name: "Artist",
    flavor: "To create is to be immortal.",
    icon: "Palette",
  },
  artificer: {
    name: "Artificer",
    flavor: "If it doesn't exist, I'll build it.",
    icon: "Wrench",
  },
} as const;

export type CharacterClass = keyof typeof CHARACTER_CLASSES;

export const CLASS_KEYS = Object.keys(CHARACTER_CLASSES) as CharacterClass[];
