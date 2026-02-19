// =============================================================================
// ShipOrSkip Pipeline — Shared Type Definitions
// CoinGecko + Moralis edition
// =============================================================================

import { InternalCategory } from "./category-map";

// ---------------------------------------------------------------------------
// Phase 1 — Discovery (CoinGecko)
// ---------------------------------------------------------------------------

export interface DiscoveredProject {
  /** CoinGecko coin ID (slug), e.g. "pancakeswap-token" */
  coingeckoId: string;
  /** Human-readable project name */
  name: string;
  /** Ticker symbol (uppercase) */
  symbol: string;
  /** Ecosystem rank derived from CoinGecko market-cap rank within bnb-chain-ecosystem */
  ecosystemRank: number;
  /** Whether the project has a listed token on CoinGecko */
  hasToken: boolean;
  /** Last 7-day trading volume in USD (from CoinGecko discovery call) */
  volume7d: number | null;
  /** Market cap in USD at time of discovery */
  marketCapUsd: number | null;
  /** 24h price change percentage */
  priceChange24h: number | null;
  /** Project thumbnail image URL */
  imageUrl: string | null;
  /** CoinGecko category tags array */
  coinGeckoCategories: string[];
  /** Resolved internal category */
  category: InternalCategory;
  /** Whether discovered in the "emerging" (low-volume) pass */
  isEmerging: boolean;
  /** Discovery timestamp */
  discoveredAt: Date;
}

// ---------------------------------------------------------------------------
// Phase 1.5 — Token Resolution (CoinGecko platforms → Moralis validate)
// ---------------------------------------------------------------------------

export interface TokenResolution {
  /** BSC contract address (checksummed) */
  contractAddress: string | null;
  /** Resolution source */
  source: "coingecko" | "moralis" | "manual" | null;
  /** Whether Moralis confirmed the contract is a valid ERC-20 on BSC */
  verified: boolean;
  /** Token name from on-chain metadata */
  onChainName: string | null;
  /** Token symbol from on-chain metadata */
  onChainSymbol: string | null;
  /** Total supply (string to avoid BigInt issues) */
  totalSupply: string | null;
  /** Decimals */
  decimals: number | null;
  /** Error message if resolution failed */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Phase 2 — Enrichment
// ---------------------------------------------------------------------------

export interface OnChainMetrics {
  /** Number of unique token holders */
  holderCount: number | null;
  /** Top-11 holders' combined % of supply */
  top11HoldersPercent: number | null;
  /** Whether top holders appear concentrated (>80% in top 5) */
  isConcentrated: boolean;
  /** 24h transfer count (proxy for tx activity) */
  transfers24h: number | null;
  /** Unique addresses sending in last 24h (proxy for active users) */
  activeAddresses24h: number | null;
}

export interface MarketMetrics {
  /** Current price in USD */
  priceUsd: number | null;
  /** 24h volume in USD */
  volume24hUsd: number | null;
  /** Estimated liquidity in USD (CoinGecko total_volume proxy or DEX pool liquidity) */
  liquidityUsd: number | null;
  /** 30-day price change percentage */
  priceChange30d: number | null;
  /** 7-day price change percentage */
  priceChange7d: number | null;
  /** All-time-high price */
  ath: number | null;
  /** % drawdown from ATH */
  athDrawdownPercent: number | null;
}

export interface SocialMetrics {
  /** Twitter/X followers */
  twitterFollowers: number | null;
  /** Recent tweet count in the past 7 days */
  recentTweetCount: number | null;
  /** Average engagement (likes + retweets) per tweet */
  avgEngagement: number | null;
  /** Sentiment score -1..1 */
  sentimentScore: number | null;
  /** Raw Grok x_search result snippets */
  grokSnippets: string[];
}

export interface TvlMetrics {
  /** Current TVL in USD (from DeFiLlama) */
  tvlUsd: number | null;
  /** 7-day TVL change percentage */
  tvlChange7d: number | null;
  /** 30-day TVL change percentage */
  tvlChange30d: number | null;
  /** DeFiLlama slug */
  defiLlamaSlug: string | null;
}

export interface EnrichedProject extends DiscoveredProject {
  // Token resolution
  resolution: TokenResolution;

  // On-chain metrics (Moralis)
  onChain: OnChainMetrics;

  // Market metrics (CoinGecko OHLCV + market chart)
  market: MarketMetrics;

  // Social (Twitter API v2 + Grok)
  social: SocialMetrics;

  // TVL (DeFiLlama)
  tvl: TvlMetrics;

  // Enrichment timestamps
  enrichedAt: Date;
  moralisEnriched: boolean;
  marketDataEnriched: boolean;
  socialEnriched: boolean;
  tvlEnriched: boolean;
}

// ---------------------------------------------------------------------------
// Phase 3 — Scoring
// ---------------------------------------------------------------------------

export interface ScoreFactor {
  key: string;
  label: string;
  value: number;   // 0..100
  weight: number;  // determined by weight profile
  weighted: number;
}

export interface ScoreResult {
  /** Final weighted score 0..100 */
  score: number;
  /** Grade: A / B / C / D / F */
  grade: "A" | "B" | "C" | "D" | "F";
  /** Active weight profile used */
  profile: string;
  /** Individual factor breakdown */
  factors: ScoreFactor[];
  /** Composite sub-scores */
  composite: {
    survival: number;
    momentum: number;
    community: number;
    fundamentals: number;
  };
  /** Scoring timestamp */
  scoredAt: Date;
}

export type Verdict = "SHIP" | "SKIP" | "WATCH";

export interface ScoredProject extends EnrichedProject {
  scoring: ScoreResult;
  verdict: Verdict;
}

// ---------------------------------------------------------------------------
// Phase 4 — AI Analysis (xAI Grok)
// ---------------------------------------------------------------------------

export interface AiAnalysis {
  /** One-paragraph "alive summary" for ship candidates */
  aliveSummary: string | null;
  /** One-paragraph post-mortem for skip candidates */
  postMortem: string | null;
  /** Key strengths (1-3 bullets) */
  strengths: string[];
  /** Key risks (1-3 bullets) */
  risks: string[];
  /** Model used */
  model: string;
  /** Analysis timestamp */
  analyzedAt: Date;
}

export interface AnalyzedProject extends ScoredProject {
  aiAnalysis: AiAnalysis | null;
}

// ---------------------------------------------------------------------------
// Pipeline Run
// ---------------------------------------------------------------------------

export interface PipelineRunStats {
  runId: string;
  startedAt: Date;
  completedAt: Date | null;
  totalProjects: number;
  enrichedProjects: number;
  scoredProjects: number;
  analyzedProjects: number;
  moralisEnriched: number;
  marketDataEnriched: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Moralis API response shapes (raw)
// ---------------------------------------------------------------------------

export interface MoralisTokenMetadata {
  address: string;
  address_label: string | null;
  name: string;
  symbol: string;
  decimals: string;
  logo: string | null;
  logo_hash: string | null;
  thumbnail: string | null;
  total_supply: string;
  total_supply_formatted: string;
  fully_diluted_valuation: string | null;
  block_number: string;
  validated: number;
  created_at: string;
  possible_spam: boolean;
  verified_contract: boolean;
}

export interface MoralisTokenHolder {
  token_address: string;
  owner_address: string;
  owner_address_label: string | null;
  balance: string;
  balance_formatted: string;
  usd_value: string | null;
  percentage_relative_to_total_supply: string;
  is_contract: boolean;
}

export interface MoralisTransfer {
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  from_address: string;
  to_address: string;
  value: string;
  value_decimal: string | null;
}

// ---------------------------------------------------------------------------
// CoinGecko market item (from /coins/markets)
// ---------------------------------------------------------------------------

export interface CoinGeckoMarketItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  last_updated: string;
}

// ---------------------------------------------------------------------------
// CoinGecko coin detail (from /coins/{id})
// ---------------------------------------------------------------------------

export interface CoinGeckoCoinDetail {
  id: string;
  symbol: string;
  name: string;
  platforms: Record<string, string | null>; // chain → contract address
  categories: string[];
  description: { en: string };
  links: {
    homepage: string[];
    twitter_screen_name: string;
    repos_url: { github: string[] };
  };
  image: { thumb: string; small: string; large: string };
  market_data: {
    current_price: { usd: number };
    total_volume: { usd: number };
    market_cap: { usd: number };
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
  };
}

// ---------------------------------------------------------------------------
// Whale signal (from signals layer)
// ---------------------------------------------------------------------------

export interface WhaleSignal {
  projectId: string;
  name: string;
  contractAddress: string;
  holderCount: number;
  top11HoldersPercent: number;
  isConcentrated: boolean;
  alertLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectedAt: Date;
}
