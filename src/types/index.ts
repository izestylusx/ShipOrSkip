// =============================================================================
// ShipOrSkip — Core TypeScript Types
// =============================================================================

export type Category =
  | "DEX"
  | "Lending"
  | "Yield"
  | "Bridge"
  | "Launchpad"
  | "Gaming"
  | "NFT"
  | "Meme"
  | "Stablecoin"
  | "Infrastructure"
  | "AI";

export type ScoringCategory =
  | "defi_token"
  | "defi_notoken"
  | "gaming_token"
  | "gaming_notoken"
  | "meme"
  | "infra_token"
  | "infra_notoken";

export type ProjectStatus = "alive" | "zombie" | "dead" | "pivoted";

export type WhaleSignalType =
  | "STEALTH_ACCUMULATION"
  | "SMART_MONEY_EXIT"
  | "ALIGNED_CONVICTION"
  | "CONFIRMED_DECLINE";

export interface WhaleSignal {
  signal: WhaleSignalType;
  label: string;
  top10BalanceChange: number;
  holderTrend: "increasing" | "stable" | "decreasing";
  smartMoneyAccumulating: boolean;
}

export interface PostMortemReport {
  whatHappened: string;
  deathPattern: string;
  timeline: string;
  rootCause: string;
  lessonForBuilders: string;
  wouldCategoryWorkToday: string;
}

export interface AliveSummary {
  whyItSurvives: string;
  keyDifferentiator: string;
  riskFactors: string;
  builderTakeaway: string;
}

export interface ProjectData {
  id: string;
  slug: string;
  name: string;
  category: Category;
  categories: Category[];
  categoryType: ScoringCategory;

  // Identifiers
  tokenAddress: string | null;
  contractAddresses: string[];
  defillamaSlug: string | null;
  coingeckoId: string | null;
  twitterHandle: string | null;
  website: string | null;

  // Scoring
  survivalScore: number;
  status: ProjectStatus;
  whaleSignal: WhaleSignal | null;

  // Factor scores (each 0-100)
  factors: {
    // Legacy factors
    tvlRetention?: number;
    txTrend?: number;
    priceTrend?: number;
    tokenQuality?: number;
    whaleConviction?: number;
    communityEngagement?: number;
    marketRelevance?: number;
    categoryHealth?: number;
    ecosystemIntegration?: number;
    holderTrend?: number;
    holderDistribution?: number;
    tradingVolume?: number;
    liquidityDepth?: number;
    contractFlags?: number;
    contractActivity?: number;
    githubActivity?: number;
    // Pipeline v2 factors
    userActivity?: number;
    userGrowth?: number;
    txActivity?: number;
    dappBayRank?: number;
    tvlHealth?: number;
    tradingHealth?: number;
    contractTrust?: number;
    holderStrength?: number;
    marketSentiment?: number;
    marketCap?: number;
    priceMomentum?: number;
    twitterActivity?: number;
  };

  // Raw data
  tvl: {
    current: number;
    peak: number;
    history: { date: string; value: number }[];
  } | null;

  token: {
    symbol: string;
    price: number;
    priceChange24h: number;
    priceChange7d: number;
    volume24h: number;
    liquidity: number;
    fdv: number;
    holders: number;
    holderChange30d: number;
    top10HolderPct: number;
    moralisScore: number | null;
    marketCap: number | null;
    athChangePercent: number | null;
    priceChange30d: number | null;
  } | null;

  twitter: {
    followers: number;
    lastTweetDate: string;
    tweetsPerWeek: number;
    avgEngagement: number;
    mentionCount90d: number;
    mentionTrend: "rising" | "flat" | "declining";
  } | null;

  contract: {
    firstTxDate: string | null;
    monthlyTx: number[];
    verified: boolean | null;
    ownershipRenounced: boolean | null;
    uniqueWallets30d: number;
    transfers24h: number | null;
  };

  // AI-generated
  postMortem: PostMortemReport | null;
  aliveSummary: AliveSummary | null;

  // Metadata
  analyzedAt: string;
  dataSources: string[];
  onchainTxHash: string | null;
}

// Token chart data
export interface TokenChartData {
  [projectId: string]: {
    tokenAddress: string;
    poolAddress: string;
    symbol: string;
    candles: {
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[];
    timeframe: "day";
    fetchedAt: string;
  };
}

// Whale signal data
export interface WhaleSignalData {
  [projectId: string]: {
    tokenAddress: string;
    topHolders: {
      address: string;
      balance: number;
      balanceUsd: number;
      percentOfSupply: number;
    }[];
    top10TotalPct: number;
    historicalHolders: { date: string; count: number }[];
    smartMoneyWallets: {
      address: string;
      profitUsd: number;
      holding: boolean;
    }[];
    signal: WhaleSignal;
    fetchedAt: string;
  };
}

// Narrative data
export interface NarrativeData {
  fetchedAt: string;
  period: { start: string; end: string };
  categories: {
    [category: string]: {
      mentionCount: number;
      mentionTrend: "rising" | "flat" | "declining";
      changePercent: number;
      topKeywords: string[];
      sentimentBreakdown: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
  };
  rising: { category: string; changePercent: number }[];
  declining: { category: string; changePercent: number }[];
}

// Idea validation
export interface IdeaValidationInput {
  description: string;
  category?: string;
  categories?: Category[];
  targetUsers?: string;
}

export type ValidationSignal = "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION";

export interface IdeaValidationResult {
  signal: ValidationSignal;
  pmfScore: number;
  similarProjects: { name: string; score: number; status: string }[];
  deathPatterns: string;
  biggestRisk: string;
  recommendation: string;
  edgeNeeded: string;
  timingAssessment: string;
}
