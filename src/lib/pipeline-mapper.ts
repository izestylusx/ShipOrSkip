/**
 * Maps a PipelineProject (from VPS API v2) to the legacy ProjectData shape
 * used by all existing frontend components.
 */

import type { PipelineProject } from "@/types/pipeline";
import type { Category, ProjectData, ProjectStatus, WhaleSignalType } from "@/types";

const CATEGORY_MAP: Record<string, Category> = {
  DeFi: "DEX",
  AI: "Infrastructure",
  Social: "Infrastructure",
  Gaming: "Gaming",
  NFT: "NFT",
  Meme: "Meme",
  Other: "Infrastructure",
};

function mapCategory(raw: string): Category {
  return CATEGORY_MAP[raw] ?? "Infrastructure";
}

function mapStatus(raw: string): ProjectStatus {
  if (raw === "alive" || raw === "zombie" || raw === "dead") return raw;
  return "zombie";
}

function mapFactors(f: PipelineProject["factors"]): ProjectData["factors"] {
  return {
    // v2 native keys
    userActivity: f.userActivity,
    userGrowth: f.userGrowth,
    txActivity: f.txActivity,
    dappBayRank: f.dappBayRank,
    tvlHealth: f.tvlHealth,
    tradingHealth: f.tradingHealth,
    contractTrust: f.contractTrust,
    holderStrength: f.holderStrength,
    marketSentiment: f.marketSentiment,
    marketCap: f.marketCap,
    priceMomentum: f.priceMomentum,
    twitterActivity: f.twitterActivity,
    categoryHealth: f.categoryHealth,
    // Legacy aliases for backwards-compatible components
    tvlRetention: f.tvlHealth,
    txTrend: f.txActivity,
    priceTrend: f.priceMomentum,
    communityEngagement: f.twitterActivity,
    marketRelevance: f.marketCap,
    holderTrend: f.holderStrength,
    contractActivity: f.contractTrust,
    ecosystemIntegration: f.dappBayRank,
    tokenQuality: f.tradingHealth,
  };
}

export interface ProjectDataWithPipeline extends ProjectData {
  _pipeline: PipelineProject;
}

export function mapPipelineProject(p: PipelineProject): ProjectDataWithPipeline {
  const category = mapCategory(p.category);

  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    category,
    categories: [category],
    categoryType: p.scoringCategory as ProjectData["categoryType"],

    tokenAddress: p.tokenAddress,
    contractAddresses: p.tokenAddress ? [p.tokenAddress] : [],
    defillamaSlug: p.defillamaSlug,
    coingeckoId: null,
    twitterHandle: p.twitterHandle,
    website: p.website,

    survivalScore: p.survivalScore,
    status: mapStatus(p.status),
    whaleSignal: p.whaleSignal
      ? {
          signal: p.whaleSignal.signal as WhaleSignalType,
          label: p.whaleSignal.label,
          top10BalanceChange: p.whaleSignal.top10BalanceChange,
          holderTrend: p.whaleSignal.holderTrend,
          smartMoneyAccumulating: p.whaleSignal.smartMoneyAccumulating,
        }
      : null,

    factors: mapFactors(p.factors),

    tvl:
      p.tvlCurrent !== null || p.tvlPeak !== null
        ? { current: p.tvlCurrent ?? 0, peak: p.tvlPeak ?? 0, history: [] }
        : null,

    token:
      p.priceUsd !== null || p.marketCapUsd !== null || p.volume24h !== null
        ? {
            symbol: p.tokenSymbol ?? "",
            price: p.priceUsd ?? 0,
            priceChange24h: p.priceChange24h ?? 0,
            priceChange7d: 0,
            volume24h: p.volume24h ?? 0,
            liquidity: p.liquidityUsd ?? 0,
            fdv: p.fdvUsd ?? 0,
            holders: p.holderCount ?? 0,
            holderChange30d: 0,
            top10HolderPct: p.top10HolderPct ?? 0,
            moralisScore: null,
            marketCap: p.marketCapUsd,
            athChangePercent: null,
            priceChange30d: null,
          }
        : null,

    twitter:
      p.twitterFollowers !== null || p.twitterDaysSincePost !== null
        ? {
            followers: p.twitterFollowers ?? 0,
            lastTweetDate: p.twitterLastPostAt ?? "",
            tweetsPerWeek: 0,
            avgEngagement: 0,
            mentionCount90d: 0,
            mentionTrend: "flat" as const,
          }
        : null,

    contract: {
      firstTxDate: null,
      monthlyTx: [],
      verified: null,
      ownershipRenounced: null,
      uniqueWallets30d: 0,
      transfers24h: p.transfers24h,
    },

    postMortem: p.aiAnalysis?.postMortem ?? null,
    aliveSummary: p.aiAnalysis?.aliveSummary
      ? {
          whyItSurvives: p.aiAnalysis.aliveSummary.summary,
          keyDifferentiator: p.aiAnalysis.aliveSummary.keyStrength,
          riskFactors: p.aiAnalysis.aliveSummary.primaryRisk,
          builderTakeaway: p.aiAnalysis.aliveSummary.builderTakeaway,
        }
      : null,

    analyzedAt: p.lastAnalyzedAt ?? p.updatedAt,
    dataSources: p.dataSources,
    onchainTxHash: null,

    _pipeline: p,
  };
}

export function mapPipelineProjects(projects: PipelineProject[]): ProjectDataWithPipeline[] {
  return projects.map(mapPipelineProject);
}
