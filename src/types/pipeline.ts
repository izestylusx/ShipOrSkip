// =============================================================================
// Pipeline v2 API Response Types
// Matches data shape from http://207.148.9.29:4000/api/v1/
// =============================================================================

export interface PipelineFactors {
  marketCap?: number;
  tvlHealth?: number;
  txActivity?: number;
  userGrowth?: number;
  dappBayRank?: number;
  userActivity?: number;
  contractTrust?: number;
  priceMomentum?: number;
  tradingHealth?: number;
  categoryHealth?: number;
  holderStrength?: number;
  marketSentiment?: number;
  twitterActivity?: number;
}

export interface PipelineAliveSummary {
  outlook: "positive" | "neutral" | "negative";
  summary: string;
  confidence: "high" | "medium" | "low";
  keyStrength: string;
  primaryRisk: string;
  builderTakeaway: string;
  competitivePosition: string;
}

export interface PipelinePostMortem {
  whatHappened: string;
  deathPattern: string;
  timeline: string;
  rootCause: string;
  lessonForBuilders: string;
  wouldCategoryWorkToday: string;
}

export interface PipelineAiAnalysis {
  model: string;
  analyzedAt: string;
  postMortem: PipelinePostMortem | null;
  aliveSummary: PipelineAliveSummary | null;
}

export interface PipelineWhaleSignal {
  signal: string;
  label: string;
  top10BalanceChange: number;
  holderTrend: "increasing" | "stable" | "decreasing";
  smartMoneyAccumulating: boolean;
}

export interface PipelineProject {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  dappbayId: string | null;
  category: string;
  scoringCategory: string;
  tokenAddress: string | null;
  tokenConfidence: string;
  tokenSymbol: string | null;
  dappbayRank: number | null;

  // User activity
  dailyUsers: number | null;
  weeklyUsers: number | null;
  weeklyUsersChange: number | null;
  monthlyUsers: number | null;
  dailyTxns: number | null;
  weeklyTxns: number | null;
  monthlyTxns: number | null;

  // DeFiLlama
  defillamaSlug: string | null;
  tvlCurrent: number | null;
  tvlPeak: number | null;
  tvlChange1d: number | null;
  tvlChange7d: number | null;
  tvlChange30d: number | null;

  // Token / on-chain
  holderCount: number | null;
  totalSupply: number | null;
  top10HolderPct: number | null;
  topHolders: { address: string; balance: number; balanceUsd: number; percentOfSupply: number }[];
  transfers24h: number | null;
  priceUsd: number | null;
  volume24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
  priceChange6h: number | null;
  priceChange1h: number | null;

  // Twitter
  twitterHandle: string | null;
  twitterLastPostAt: string | null;
  twitterDaysSincePost: number | null;
  twitterFollowers: number | null;
  twitterLastPost: string | null;
  twitterShadowbanned: boolean;

  // Scoring
  survivalScore: number;
  status: "alive" | "zombie" | "dead";
  factors: PipelineFactors;
  whaleSignal: PipelineWhaleSignal | null;
  aiAnalysis: PipelineAiAnalysis | null;

  // Metadata
  lastAnalyzedAt: string | null;
  dataSources: string[];
  lastEnrichedAt: string | null;
  lastScoredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineProjectsResponse {
  data: PipelineProject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PipelineStatsResponse {
  totalProjects: number;
  byStatus: {
    alive: number;
    zombie: number;
    dead: number;
  };
  byCategory: Record<string, number>;
  avgSurvivalScore: number;
  lastUpdated: string;
}
