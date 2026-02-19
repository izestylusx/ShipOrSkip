// =============================================================================
// ShipOrSkip Pipeline — Internal Types
// =============================================================================

// Re-export all frontend types
export type {
  Category,
  ScoringCategory,
  ProjectStatus,
  WhaleSignalType,
  WhaleSignal,
  PostMortemReport,
  AliveSummary,
  ProjectData,
  TokenChartData,
  WhaleSignalData,
  NarrativeData,
  IdeaValidationInput,
  ValidationSignal,
  IdeaValidationResult,
} from "../../src/types";

// ---------------------------------------------------------------------------
// Pipeline-internal types
// ---------------------------------------------------------------------------

/** Raw protocol data from DeFiLlama /protocols endpoint */
export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  chains: string[];
  category: string;
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
  change_1m: number | null;
  mcap: number | null;
  logo: string;
  url: string;
  twitter: string | null;
  gecko_id: string | null;
  address: string | null;
  chain: string;
  symbol: string;
}

/** Seed entry — the initial project record before enrichment */
export interface SeedProject {
  id: string;
  slug: string;
  name: string;
  category: string;
  categories?: string[];
  defillamaSlug: string | null;
  coingeckoId: string | null;
  tokenAddress: string | null;
  contractAddresses: string[];
  twitterHandle: string | null;
  website: string | null;
  source: "coingecko" | "curated" | "manual" | "dappbay";
  dappbayId?: number | null;
}

/** Raw enrichment data collected from all sources before scoring */
export interface RawEnrichmentData {
  projectId: string;
  moralis: MoralisEnrichment | null;
  bscscan: BSCScanEnrichment | null;
  geckoTerminal: GeckoTerminalEnrichment | null;
  dexScreener: DexScreenerEnrichment | null;
}

/** Moralis API enrichment data */
export interface MoralisEnrichment {
  tokenPrice: number | null;
  priceChange24h: number | null;
  tokenHolders: number | null;
  holderChange30d: number | null;
  top10HolderPct: number | null;
  totalSupply: string | null;
  circulatingSupply: string | null;
  volume24h: number | null;
  liquidity: number | null;
  fdv: number | null;
  moralisScore: number | null;
  fetchedAt: string;
}

/** BSCScan API enrichment data */
export interface BSCScanEnrichment {
  contractVerified: boolean;
  ownershipRenounced: boolean;
  firstTxDate: string | null;
  monthlyTxCounts: number[];
  uniqueWallets30d: number;
  sourceCodeAvailable: boolean;
  fetchedAt: string;
}

/** GeckoTerminal API enrichment data */
export interface GeckoTerminalEnrichment {
  poolAddress: string | null;
  dexId: string | null;
  baseTokenSymbol: string | null;
  quoteTokenSymbol: string | null;
  priceUsd: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  ohlcv: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  fetchedAt: string;
}

/** DexScreener API enrichment data */
export interface DexScreenerEnrichment {
  pairs: DexScreenerPair[];
  fetchedAt: string;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  volume: { h24: number; h6: number; h1: number; m5: number };
  priceChange: { h24: number; h6: number; h1: number; m5: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  txns: {
    h24: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    m5: { buys: number; sells: number };
  };
}

/** Whale enrichment data (from 07b — NodeReal Enhanced API + DexScreener) */
export interface WhaleEnrichment {
  /** Total number of token holders */
  holderCount: number;
  /** Total supply (decimal string) */
  totalSupply: string;
  /** Top 10 holders (excluding burn addresses) */
  top10Holders: {
    address: string;
    balance: string;
    balanceFormatted: number;
    pctOfSupply: number;
  }[];
  /** Aggregated: top 10 holder % of supply */
  top10HolderPct: number;
  /** DexScreener buy/sell ratios (cached) */
  dexBuySellRatio24h: number | null;
  dexBuySellRatio6h: number | null;
  dexBuySellRatio1h: number | null;
  dexVolume24h: number | null;
  dexPriceChange24h: number | null;
  dexLiquidityUsd: number | null;
  cuConsumed: number;
  fetchedAt: string;
}

/** NodeReal BSC RPC enrichment data */
export interface NodeRealEnrichment {
  transfers24h: number;
  ownerAddress: string | null;
  ownershipRenounced: boolean;
  totalSupply: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  hasContractCode: boolean;
  bnbBalance: number;
  fetchedAt: string;
}

/** CoinGecko API enrichment data */
export interface CoinGeckoEnrichment {
  coingeckoId: string;
  symbol: string | null;
  marketCap: number | null;
  price: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  ath: number | null;
  athChangePercent: number | null;
  volume24h: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  fdv: number | null;
  categories: string[];
  bscAddress: string | null;
  // Community data
  twitterHandle: string | null;
  telegramMembers: number | null;
  watchlistUsers: number | null;
  sentimentUpPct: number | null;
  // Developer data
  commitCount4w: number | null;
  fetchedAt: string;
}

/** DeFiLlama per-protocol TVL enrichment data */
export interface DeFiLlamaTvlEnrichment {
  slug: string;
  tvlCurrent: number;
  tvlPeak: number;
  tvlHistory: { date: string; tvl: number }[];
  chainTvls?: Record<string, number>;
  fetchedAt: string;
}

/** DappBay API enrichment data (BNB Chain official directory) */
export interface DappBayEnrichment {
  dappbayId: number;
  dappbaySlug: string;
  dappbayCategory: string;
  rank: number;
  isOfficial: boolean;
  riskType: string | null;
  riskLevel: string | null;
  description: string | null;
  launchTime: number | null;
  chains: string[];
  weeklyUsers: number | null;
  weeklyUsersChange: number | null;
  weeklyTxns: number | null;
  weeklyTxnsChange: number | null;
  weeklyTvl: number | null;
  weeklyTvlChange: number | null;
  monthlyUsers: number | null;
  monthlyTxns: number | null;
  userHistory7d: { timestamp: number; value: number }[];
  txnHistory7d: { timestamp: number; value: number }[];
  fetchedAt: string;
}

/** Twitter/X API enrichment data */
export interface TwitterEnrichment {
  username: string;
  userId: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  likeCount: number | null;
  description: string | null;
  createdAt: string | null;
  // Mention volume (only for borderline projects)
  mentionCount7d: number | null;
  fetchedAt: string;
}

/** Scoring weight map */
export type ScoringWeights = Record<string, number>;

/** Rate limiter configuration */
export interface RateLimiterConfig {
  name: string;
  maxRequests: number;
  windowMs: number;
  /** For CU-based limiters (Moralis) */
  maxCU?: number;
  cuWindowMs?: number;
}
