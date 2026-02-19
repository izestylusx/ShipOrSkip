// =============================================================================
// ShipOrSkip Pipeline — Phase 2: Enricher
// =============================================================================
// Multi-source enrichment:
//   1. DeFiLlama TVL    — DeFi projects
//   2. Moralis on-chain — token projects (holder count, concentration, tx activity)
//   3. CoinGecko OHLCV  — token projects (price, volume, 30d change, ATH)
// Social enrichment (Twitter/Grok) runs in Phase 2.5 (twitter-enricher.ts)
// =============================================================================

import { createLogger } from "../shared/logger";
import * as defillama from "../sources/defillama";
import { enrichOnChain } from "../sources/moralis";
import { getMarketData } from "../sources/coingecko";
import type {
  DiscoveredProject,
  TokenResolution,
  EnrichedProject,
  OnChainMetrics,
  MarketMetrics,
  SocialMetrics,
  TvlMetrics,
} from "../shared/types";

const logger = createLogger("enricher");

export interface EnricherResult {
  projects: EnrichedProject[];
  stats: {
    total: number;
    tvlMatches: number;
    moralisEnriched: number;
    marketDataEnriched: number;
  };
  durationMs: number;
}

const EMPTY_ONCHAIN: OnChainMetrics = {
  holderCount: null,
  top11HoldersPercent: null,
  isConcentrated: false,
  transfers24h: null,
  activeAddresses24h: null,
};

const EMPTY_MARKET: MarketMetrics = {
  priceUsd: null,
  volume24hUsd: null,
  liquidityUsd: null,
  priceChange30d: null,
  priceChange7d: null,
  ath: null,
  athDrawdownPercent: null,
};

const EMPTY_SOCIAL: SocialMetrics = {
  twitterFollowers: null,
  recentTweetCount: null,
  avgEngagement: null,
  sentimentScore: null,
  grokSnippets: [],
};

const EMPTY_TVL: TvlMetrics = {
  tvlUsd: null,
  tvlChange7d: null,
  tvlChange30d: null,
  defiLlamaSlug: null,
};

/**
 * Phase 2: Enrich discovered projects with on-chain, market, and TVL data.
 */
export async function enrich(
  discovered: DiscoveredProject[],
  resolutions: Map<string, TokenResolution>
): Promise<EnricherResult> {
  const start = Date.now();
  const enriched: EnrichedProject[] = [];
  const stats = {
    total: discovered.length,
    tvlMatches: 0,
    moralisEnriched: 0,
    marketDataEnriched: 0,
  };

  logger.info(`Phase 2: Enriching ${discovered.length} projects`);
  defillama.clearProtocolCache();

  for (const project of discovered) {
    const resolution = resolutions.get(project.coingeckoId) ?? null;
    const hasToken = !!resolution?.contractAddress && resolution.verified;
    const addr = resolution?.contractAddress ?? null;

    // --- TVL (DeFiLlama) ---
    let tvl: TvlMetrics = EMPTY_TVL;
    if (project.category === "defi") {
      tvl = await defillama.enrichTvl(project.name);
      if (tvl.tvlUsd !== null) stats.tvlMatches++;
    }

    // --- On-chain (Moralis) ---
    let onChain: OnChainMetrics = EMPTY_ONCHAIN;
    let moralisEnriched = false;
    if (hasToken && addr) {
      try {
        onChain = await enrichOnChain(addr);
        moralisEnriched = true;
        stats.moralisEnriched++;
      } catch (err: unknown) {
        logger.warn(`Moralis enrichment failed for ${project.name}`, err);
      }
    }

    // --- Market data (CoinGecko) ---
    let market: MarketMetrics = {
      ...EMPTY_MARKET,
      priceChange24h: project.priceChange24h,
      marketCapUsd: project.marketCapUsd,
    } as MarketMetrics;
    let marketDataEnriched = false;
    if (project.coingeckoId) {
      try {
        const ohlcv = await getMarketData(project.coingeckoId);
        market = {
          priceUsd: ohlcv.priceUsd,
          volume24hUsd: ohlcv.volume24hUsd,
          liquidityUsd: ohlcv.liquidityProxyUsd,
          priceChange30d: ohlcv.priceChange30d,
          priceChange7d: ohlcv.priceChange7d,
          ath: ohlcv.ath,
          athDrawdownPercent: ohlcv.athDrawdownPercent,
        };
        marketDataEnriched = true;
        stats.marketDataEnriched++;
      } catch (err: unknown) {
        logger.warn(`CoinGecko market data failed for ${project.name}`, err);
      }
    }

    enriched.push({
      ...project,
      resolution: resolution ?? {
        contractAddress: null,
        source: null,
        verified: false,
        onChainName: null,
        onChainSymbol: null,
        totalSupply: null,
        decimals: null,
        error: "No resolution",
      },
      onChain,
      market,
      social: EMPTY_SOCIAL,
      tvl,
      enrichedAt: new Date(),
      moralisEnriched,
      marketDataEnriched,
      socialEnriched: false,
      tvlEnriched: tvl.tvlUsd !== null,
    });
  }

  const dur = Date.now() - start;
  logger.info(
    `Phase 2 complete in ${(dur / 1000).toFixed(1)}s: ` +
      `DeFiLlama=${stats.tvlMatches}, Moralis=${stats.moralisEnriched}, ` +
      `MarketData=${stats.marketDataEnriched}`
  );

  return { projects: enriched, stats, durationMs: dur };
}
