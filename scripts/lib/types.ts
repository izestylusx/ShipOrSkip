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
  defillamaSlug: string | null;
  coingeckoId: string | null;
  tokenAddress: string | null;
  contractAddresses: string[];
  twitterHandle: string | null;
  website: string | null;
  source: "defillama" | "curated" | "manual";
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
