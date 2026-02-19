// =============================================================================
// ShipOrSkip Pipeline — 12 Scoring Factors
// =============================================================================
// Each factor returns a score 0-100.
// Sources: CoinGecko market data + Moralis on-chain + DeFiLlama TVL + Twitter
// =============================================================================

import type { EnrichedProject } from "../shared/types";

export function computeFactors(project: EnrichedProject): Record<string, number> {
  return {
    userActivity: scoreUserActivity(project),
    userGrowth: scoreUserGrowth(project),
    txActivity: scoreTxActivity(project),
    tvlHealth: scoreTvlHealth(project),
    priceMomentum: scorePriceMomentum(project),
    tradingHealth: scoreTradingHealth(project),
    holderStrength: scoreHolderStrength(project),
    marketSentiment: scoreMarketSentiment(project),
    contractTrust: scoreContractTrust(project),
    categoryHealth: 50, // placeholder — overridden by scorer.ts pass 2
    ecosystemRank: scoreEcosystemRank(project),
    marketCap: scoreMarketCap(project),
    twitterActivity: scoreTwitterActivity(project),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 1: userActivity — proxy via Moralis active addresses + CoinGecko volume
// ──────────────────────────────────────────────────────────────────────────────

function scoreUserActivity(p: EnrichedProject): number {
  // Use active on-chain addresses as user-activity proxy
  const active = p.onChain.activeAddresses24h ?? 0;
  if (active > 5_000) return 90;
  if (active > 1_000) return 75;
  if (active > 200) return 55;
  if (active > 50) return 40;
  if (active > 0) return 25;

  // Fallback: volume as engagement proxy
  const vol = p.market.volume24hUsd ?? 0;
  if (vol > 10_000_000) return 70;
  if (vol > 1_000_000) return 55;
  if (vol > 100_000) return 40;
  if (vol > 0) return 25;
  return 15;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 2: userGrowth — 7d price trend as activity growth proxy
// ──────────────────────────────────────────────────────────────────────────────

function scoreUserGrowth(p: EnrichedProject): number {
  const change7d = p.market.priceChange7d;
  if (change7d === null) return 40;
  if (change7d > 20) return 85;
  if (change7d > 5) return 70;
  if (change7d > 0) return 55;
  if (change7d > -10) return 35;
  return 15;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 3: txActivity — Moralis 24h transfer count → weekly proxy
// ──────────────────────────────────────────────────────────────────────────────

function scoreTxActivity(p: EnrichedProject): number {
  const transfers24h = p.onChain.transfers24h ?? 0;
  const weeklyEstimate = transfers24h * 7;
  return bucketTxns(weeklyEstimate);
}

function bucketTxns(txns: number): number {
  if (txns > 500_000) return 90;
  if (txns > 50_000) return 75;
  if (txns > 5_000) return 55;
  if (txns > 500) return 40;
  if (txns > 0) return 25;
  return 10;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 4: tvlHealth — DeFi TVL retention
// ──────────────────────────────────────────────────────────────────────────────

function scoreTvlHealth(p: EnrichedProject): number {
  const { tvlUsd, tvlChange30d } = p.tvl;

  if (tvlUsd !== null) {
    // TVL size tier
    let sizeScore = 50;
    if (tvlUsd > 100_000_000) sizeScore = 90;
    else if (tvlUsd > 10_000_000) sizeScore = 75;
    else if (tvlUsd > 1_000_000) sizeScore = 55;
    else if (tvlUsd > 100_000) sizeScore = 40;
    else sizeScore = 20;

    // TVL trend modifier
    let trendMod = 0;
    if (tvlChange30d !== null) {
      if (tvlChange30d > 20) trendMod = 10;
      else if (tvlChange30d > 0) trendMod = 5;
      else if (tvlChange30d > -20) trendMod = -5;
      else trendMod = -15;
    }

    return Math.min(100, Math.max(0, sizeScore + trendMod));
  }

  // Non-DeFi: use liquidity as proxy
  const liq = p.market.liquidityUsd ?? 0;
  if (liq > 10_000_000) return 80;
  if (liq > 1_000_000) return 60;
  if (liq > 100_000) return 45;
  if (liq > 0) return 25;
  return 10;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 5: priceMomentum — 30d price trend
// ──────────────────────────────────────────────────────────────────────────────

function scorePriceMomentum(p: EnrichedProject): number {
  if (p.resolution.contractAddress === null) return 50;
  const change = p.market.priceChange30d;
  if (change === null) return 40;
  if (change > 50) return 90;
  if (change > 10) return 75;
  if (change > 0) return 60;
  if (change > -20) return 40;
  if (change > -50) return 20;
  return 10;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 6: tradingHealth — volume vs market cap ratio
// ──────────────────────────────────────────────────────────────────────────────

function scoreTradingHealth(p: EnrichedProject): number {
  const vol = p.market.volume24hUsd ?? 0;
  const mcap = p.marketCapUsd ?? 0;
  if (mcap === 0) {
    // No mcap — score on raw volume
    if (vol > 10_000_000) return 80;
    if (vol > 1_000_000) return 60;
    if (vol > 100_000) return 40;
    return 15;
  }
  const ratio = vol / mcap;
  if (ratio > 0.5) return 90;
  if (ratio > 0.1) return 75;
  if (ratio > 0.02) return 55;
  if (ratio > 0.005) return 35;
  return 15;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 7: holderStrength — holder count + distribution
// Source: Moralis getTokenOwners
// ──────────────────────────────────────────────────────────────────────────────

function scoreHolderStrength(p: EnrichedProject): number {
  if (p.resolution.contractAddress === null) return 50;

  const count = p.onChain.holderCount ?? 0;
  let countScore = 10;
  if (count > 100_000) countScore = 90;
  else if (count > 10_000) countScore = 75;
  else if (count > 5_000) countScore = 60;
  else if (count > 1_000) countScore = 45;
  else if (count > 100) countScore = 30;

  const top11 = p.onChain.top11HoldersPercent;
  let distScore = 50;
  if (top11 !== null) {
    if (top11 < 20) distScore = 90;
    else if (top11 < 40) distScore = 70;
    else if (top11 < 60) distScore = 50;
    else if (top11 < 80) distScore = 30;
    else distScore = 10;
  }

  return Math.round(countScore * 0.5 + distScore * 0.5);
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 8: marketSentiment — 24h + 7d price change composite
// ──────────────────────────────────────────────────────────────────────────────

function scoreMarketSentiment(p: EnrichedProject): number {
  if (p.resolution.contractAddress === null) return 50;

  const h24 = p.market.priceChange7d ?? 0;
  const h7 = p.priceChange24h ?? 0;
  const composite = h24 * 0.4 + h7 * 0.6;

  if (composite > 10) return 85;
  if (composite > 3) return 70;
  if (composite > 0) return 55;
  if (composite > -3) return 45;
  if (composite > -10) return 30;
  return 15;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 9: contractTrust — verified, non-spam, non-concentrated
// Source: Moralis verifyBscContract
// ──────────────────────────────────────────────────────────────────────────────

function scoreContractTrust(p: EnrichedProject): number {
  let score = 40;
  if (p.resolution.contractAddress) score += 10;
  if (p.resolution.verified) score += 20;
  if (p.onChain.holderCount && p.onChain.holderCount > 100) score += 15;
  if (!p.onChain.isConcentrated) score += 10;
  if (p.market.liquidityUsd && p.market.liquidityUsd > 10_000) score += 5;
  return Math.min(score, 100);
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 11: ecosystemRank — CoinGecko BNB Chain ecosystem rank signal
// ──────────────────────────────────────────────────────────────────────────────

function scoreEcosystemRank(p: EnrichedProject): number {
  const rank = p.ecosystemRank;
  if (rank <= 50) return 90;
  if (rank <= 100) return 75;
  if (rank <= 200) return 60;
  if (rank <= 500) return 45;
  return 30;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 12: marketCap — tier-based scoring
// ──────────────────────────────────────────────────────────────────────────────

function scoreMarketCap(p: EnrichedProject): number {
  if (p.resolution.contractAddress === null) {
    const tvl = p.tvl.tvlUsd ?? 0;
    if (tvl > 100_000_000) return 90;
    if (tvl > 10_000_000) return 75;
    if (tvl > 1_000_000) return 55;
    if (tvl > 100_000) return 40;
    const rank = p.ecosystemRank;
    if (rank <= 50) return 60;
    if (rank <= 100) return 50;
    return 35;
  }

  const mcap = p.marketCapUsd ?? 0;
  if (mcap > 500_000_000) return 90;
  if (mcap > 50_000_000) return 75;
  if (mcap > 5_000_000) return 55;
  if (mcap > 500_000) return 40;
  if (mcap > 0) return 20;
  return 10;
}

// ──────────────────────────────────────────────────────────────────────────────
// Factor 13: twitterActivity — is the team still posting?
// ──────────────────────────────────────────────────────────────────────────────

function scoreTwitterActivity(p: EnrichedProject): number {
  if (!p.social.recentTweetCount && p.social.twitterFollowers === null) return 50;
  const days = p.social.recentTweetCount !== null
    ? (p.social.recentTweetCount > 0 ? 0 : 90) // proxy if no daysSince
    : 90;
  if (days <= 7) return 90;
  if (days <= 14) return 75;
  if (days <= 30) return 60;
  if (days <= 60) return 35;
  if (days <= 90) return 20;
  return 5;
}
