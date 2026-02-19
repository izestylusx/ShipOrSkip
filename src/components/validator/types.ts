export type ValidationSignal = "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION";

export interface RedditThread {
  subreddit: string;
  title: string;
  url: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
}

export interface RedditCommunityIntel {
  communityBuzz: "high" | "moderate" | "low" | "none";
  relevantThreads: RedditThread[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  keyInsights: string[];
}

export interface SimilarProject {
  name: string;
  slug: string;
  score: number;
  status: "alive" | "zombie" | "dead" | "pivoted";
  category: string;
  marketCap: number | null;
  matchReasons: string[];
}

export interface TopicTweet {
  author: string;
  text: string;
  context: string;
}

export interface CategoryContextWeight {
  category: string;
  weight: number;
  confidence: number;
}

export interface InferredCategory {
  category: string;
  confidence: number;
  matchedSignals: string[];
}

export interface ValidationCategoryContext {
  source: "user_selected" | "auto_inferred";
  primaryCategory: string;
  categories: CategoryContextWeight[];
  inferredCategories: InferredCategory[];
}

export interface CategorySurvivalInfo {
  category: string;
  alive: number;
  zombie: number;
  dead: number;
  total: number;
  survivalRate: number;
}

export interface EcosystemIntelForUI {
  overallSurvivalRate: number;
  categorySurvival: CategorySurvivalInfo | null;
  topDeathPatterns: { pattern: string; count: number; percentage: number }[];
}

export interface CommunityStatsForUI {
  totalValidations: number;
  similarIdeaCount: number;
  avgPmfScore: number;
}

export interface ValidationResultData {
  signal: ValidationSignal;
  pmfScore: number;
  similarProjects: SimilarProject[];
  categoryContext?: ValidationCategoryContext;
  deathPatterns: string;
  biggestRisk: string;
  recommendation: string;
  edgeNeeded: string;
  timingAssessment: string;
  ecosystemStats?: {
    totalProjects: number;
    alive: number;
    zombie: number;
    dead: number;
  };
  analysisMode?: "ai" | "ai_grok_fallback" | "fallback";
  redditIntel?: RedditCommunityIntel;
  fallbackReason?: string;
  trendAnalysis?: ValidationTrendAnalysis;
  ecosystemIntelligence?: EcosystemIntelForUI;
  communityStats?: CommunityStatsForUI;
}

export interface ValidationTrendAnalysis {
  categoryTrend: "rising" | "stable" | "declining";
  trendScore: number;
  buzzLevel: "high" | "moderate" | "low" | "none";
  narrative: string;
  risingKeywords: string[];
  decliningKeywords: string[];
  timingVerdict: string;
  topicTweets?: TopicTweet[];
}

export interface ValidationHistoryItem {
  id: string;
  description: string;
  category: string;
  signal: ValidationSignal;
  pmfScore: number;
  timestamp: string;
}
