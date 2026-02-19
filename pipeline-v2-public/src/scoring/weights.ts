// =============================================================================
// ShipOrSkip Pipeline — Scoring Weight Profiles
// =============================================================================
// 7 category-specific weight profiles. Weights sum to 100 per category.
// No-token variants zero out price/holder/trading/sentiment factors.
// =============================================================================

export type ScoringCategory =
  | "defi_token"
  | "defi_notoken"
  | "gaming_token"
  | "gaming_notoken"
  | "meme"
  | "infra_token"
  | "infra_notoken";

export type WeightProfile = Record<string, number>;

const WEIGHT_PROFILES: Record<ScoringCategory, WeightProfile> = {
  defi_token: {
    userActivity: 11,
    userGrowth: 8,
    txActivity: 9,
    tvlHealth: 13,
    priceMomentum: 8,
    tradingHealth: 9,
    holderStrength: 8,
    marketSentiment: 7,
    contractTrust: 5,
    categoryHealth: 5,
    ecosystemRank: 7,
    marketCap: 5,
    twitterActivity: 5,
  },
  defi_notoken: {
    userActivity: 14,
    userGrowth: 11,
    txActivity: 14,
    tvlHealth: 17,
    priceMomentum: 0,
    tradingHealth: 0,
    holderStrength: 0,
    marketSentiment: 0,
    contractTrust: 8,
    categoryHealth: 8,
    ecosystemRank: 11,
    marketCap: 10,
    twitterActivity: 7,
  },
  gaming_token: {
    userActivity: 13,
    userGrowth: 9,
    txActivity: 11,
    tvlHealth: 5,
    priceMomentum: 8,
    tradingHealth: 8,
    holderStrength: 7,
    marketSentiment: 7,
    contractTrust: 5,
    categoryHealth: 5,
    ecosystemRank: 9,
    marketCap: 8,
    twitterActivity: 5,
  },
  gaming_notoken: {
    userActivity: 18,
    userGrowth: 14,
    txActivity: 18,
    tvlHealth: 10,
    priceMomentum: 0,
    tradingHealth: 0,
    holderStrength: 0,
    marketSentiment: 0,
    contractTrust: 10,
    categoryHealth: 7,
    ecosystemRank: 16,
    marketCap: 0,
    twitterActivity: 7,
  },
  meme: {
    userActivity: 5,
    userGrowth: 5,
    txActivity: 5,
    tvlHealth: 0,
    priceMomentum: 14,
    tradingHealth: 14,
    holderStrength: 10,
    marketSentiment: 14,
    contractTrust: 5,
    categoryHealth: 5,
    ecosystemRank: 5,
    marketCap: 10,
    twitterActivity: 8,
  },
  infra_token: {
    userActivity: 11,
    userGrowth: 9,
    txActivity: 11,
    tvlHealth: 5,
    priceMomentum: 7,
    tradingHealth: 8,
    holderStrength: 8,
    marketSentiment: 7,
    contractTrust: 7,
    categoryHealth: 5,
    ecosystemRank: 9,
    marketCap: 8,
    twitterActivity: 5,
  },
  infra_notoken: {
    userActivity: 16,
    userGrowth: 14,
    txActivity: 18,
    tvlHealth: 0,
    priceMomentum: 0,
    tradingHealth: 0,
    holderStrength: 0,
    marketSentiment: 0,
    contractTrust: 10,
    categoryHealth: 8,
    ecosystemRank: 14,
    marketCap: 12,
    twitterActivity: 8,
  },
};

export function getWeights(category: ScoringCategory | string): WeightProfile {
  const profile = WEIGHT_PROFILES[category as ScoringCategory];
  return profile ?? WEIGHT_PROFILES.infra_token;
}

export function getActiveFactors(category: ScoringCategory | string): string[] {
  return Object.entries(getWeights(category))
    .filter(([, w]) => w > 0)
    .map(([k]) => k);
}
