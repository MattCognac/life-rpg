export const DISCIPLINES = [
  { slug: "body", name: "Body", description: "Physical prowess & adventure", icon: "Sword", color: "#dd6119" },
  { slug: "mind", name: "Mind", description: "Knowledge, technology & communication", icon: "Brain", color: "#dd6119" },
  { slug: "spirit", name: "Spirit", description: "Spirituality, mindfulness & inner growth", icon: "Sparkles", color: "#dd6119" },
  { slug: "nature", name: "Nature", description: "The living world & its bounty", icon: "Leaf", color: "#dd6119" },
  { slug: "craft", name: "Craft", description: "Making, building & creating", icon: "Hammer", color: "#dd6119" },
  { slug: "life", name: "Life", description: "Home, health, livelihood & self", icon: "Heart", color: "#dd6119" },
] as const;

export type DisciplineSlug = (typeof DISCIPLINES)[number]["slug"];

export const DISCIPLINE_SLUGS = DISCIPLINES.map((r) => r.slug) as [DisciplineSlug, ...DisciplineSlug[]];

export function getDisciplineBySlug(slug: string) {
  return DISCIPLINES.find((r) => r.slug === slug);
}

export function isValidDiscipline(slug: string): slug is DisciplineSlug {
  return DISCIPLINES.some((r) => r.slug === slug);
}

export const CHAIN_TIERS = [
  { slug: "common", name: "Common", color: "#9ca3af" },
  { slug: "uncommon", name: "Uncommon", color: "#4ade80" },
  { slug: "rare", name: "Rare", color: "#60a5fa" },
  { slug: "epic", name: "Epic", color: "#c084fc" },
  { slug: "legendary", name: "Legendary", color: "#ff8201" },
] as const;

export type ChainTier = (typeof CHAIN_TIERS)[number]["slug"];

export function getChainTier(slug: string) {
  return CHAIN_TIERS.find((t) => t.slug === slug);
}

export const CHAIN_TIER_BONUS: Record<ChainTier, number> = {
  common: 0,
  uncommon: 0.1,
  rare: 0.15,
  epic: 0.25,
  legendary: 0.5,
};
