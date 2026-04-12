export const REALMS = [
  { slug: "body", name: "Body", description: "Physical prowess & adventure", icon: "Sword", color: "#ad2817" },
  { slug: "mind", name: "Mind", description: "Knowledge, technology & communication", icon: "Brain", color: "#60a5fa" },
  { slug: "spirit", name: "Spirit", description: "Spirituality, mindfulness & inner growth", icon: "Sparkles", color: "#eab308" },
  { slug: "nature", name: "Nature", description: "The living world & its bounty", icon: "Leaf", color: "#4ade80" },
  { slug: "craft", name: "Craft", description: "Making, building & creating", icon: "Hammer", color: "#ff8201" },
  { slug: "life", name: "Life", description: "Home, health, livelihood & self", icon: "Heart", color: "#c084fc" },
] as const;

export type RealmSlug = (typeof REALMS)[number]["slug"];

export const REALM_SLUGS = REALMS.map((r) => r.slug) as [RealmSlug, ...RealmSlug[]];

export function getRealmBySlug(slug: string) {
  return REALMS.find((r) => r.slug === slug);
}

export function isValidRealm(slug: string): slug is RealmSlug {
  return REALMS.some((r) => r.slug === slug);
}

export const CHAIN_TIERS = [
  { slug: "common", name: "Common", color: "#9ca3af" },
  { slug: "uncommon", name: "Uncommon", color: "#4ade80" },
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
  epic: 0.25,
  legendary: 0.5,
};
