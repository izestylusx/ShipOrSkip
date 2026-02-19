// =============================================================================
// ShipOrSkip Pipeline — CoinGecko Category → Internal Category Mapping
// Aligns CoinGecko's category tags to ShipOrSkip's internal project categories
// =============================================================================

export type InternalCategory =
  | "defi"
  | "gaming"
  | "meme"
  | "infra"
  | "nft"
  | "social"
  | "other";

type CategoryRule = {
  keywords: string[];
  category: InternalCategory;
};

// Priority order matters — first match wins
const RULES: CategoryRule[] = [
  {
    keywords: ["meme", "dog", "cat", "pepe", "shib", "floki", "elon"],
    category: "meme",
  },
  {
    keywords: [
      "defi",
      "dex",
      "exchange",
      "swap",
      "yield",
      "lending",
      "borrowing",
      "staking",
      "liquid-staking",
      "derivatives",
      "perpetual",
      "options",
      "amm",
      "liquidity",
    ],
    category: "defi",
  },
  {
    keywords: [
      "gaming",
      "game",
      "gamefi",
      "play-to-earn",
      "p2e",
      "nft-gaming",
      "metaverse",
    ],
    category: "gaming",
  },
  {
    keywords: [
      "nft",
      "non-fungible",
      "collectibles",
      "art",
      "marketplace",
      "virtual-world",
    ],
    category: "nft",
  },
  {
    keywords: [
      "social",
      "socialfi",
      "creator",
      "fan-token",
      "dao",
      "governance",
      "community",
    ],
    category: "social",
  },
  {
    keywords: [
      "infrastructure",
      "oracle",
      "bridge",
      "cross-chain",
      "layer-2",
      "storage",
      "identity",
      "privacy",
      "wallet",
      "tool",
      "dev-tool",
    ],
    category: "infra",
  },
];

/**
 * Maps a CoinGecko category string (or array of tags) to the ShipOrSkip
 * internal category enum.
 */
export function mapCoinGeckoCategory(
  cgCategory: string | string[] | null | undefined
): InternalCategory {
  if (!cgCategory) return "other";

  const input = Array.isArray(cgCategory)
    ? cgCategory.join(" ").toLowerCase()
    : cgCategory.toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => input.includes(kw))) {
      return rule.category;
    }
  }

  return "other";
}

/**
 * Returns the token ownership model expected for this category.
 * DeFi + infra projects often have no native token ("notoken" variant).
 */
export function hasTypicalToken(category: InternalCategory): boolean {
  // meme / gaming always have tokens; defi/infra may not
  return category === "meme" || category === "gaming";
}
