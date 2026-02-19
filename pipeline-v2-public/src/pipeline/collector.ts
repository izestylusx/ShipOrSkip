// =============================================================================
// ShipOrSkip Pipeline — Phase 1: Collector
// Discovers BNB Chain projects via CoinGecko Pro bnb-chain-ecosystem category
// Two-pass strategy: top 200 by market cap + 22 emerging (lowest volume)
// =============================================================================

import { createLogger } from "../shared/logger";
import { discoverProjects } from "../sources/coingecko";
import type { DiscoveredProject } from "../shared/types";

const logger = createLogger("collector");

export interface CollectorResult {
  projects: DiscoveredProject[];
  stats: {
    pass1Count: number;
    emergingCount: number;
    total: number;
    withMarketCap: number;
    categoryBreakdown: Record<string, number>;
  };
  durationMs: number;
}

export interface CollectOptions {
  topN?: number;
  emergingLimit?: number;
  mode?: "full" | "incremental";
  existingIds?: Set<string>;
}

/**
 * Phase 1: Collect BNB Chain projects from CoinGecko.
 *
 * Full mode (default):
 *   - Pass 1: top 200 by market_cap_desc
 *   - Pass 2: 22 unique projects from volume_asc (emerging/undervalued)
 *
 * Incremental mode:
 *   - Fetches pass-2 emerging set only, skips already-known coingeckoIds
 */
export async function collect(options?: CollectOptions): Promise<CollectorResult> {
  const start = Date.now();
  const {
    topN = 200,
    emergingLimit = parseInt(process.env.PIPELINE_EMERGING_LIMIT ?? "22", 10),
    mode = "full",
    existingIds,
  } = options ?? {};

  if (mode === "incremental") {
    logger.info(
      `Phase 1 INCREMENTAL: fetching emerging ${emergingLimit} projects, skipping ${existingIds?.size ?? 0} existing`
    );
  } else {
    logger.info(
      `Phase 1 FULL: top ${topN} + ${emergingLimit} emerging BNB Chain projects`
    );
  }

  let projects: DiscoveredProject[];

  if (mode === "incremental") {
    // Only emerging pass; filter out known IDs
    const all = await discoverProjects({ topN: 0, emergingLimit });
    projects = existingIds
      ? all.filter((p) => !existingIds.has(p.coingeckoId))
      : all;
  } else {
    projects = await discoverProjects({ topN, emergingLimit });
    if (existingIds) {
      projects = projects.filter((p) => !existingIds.has(p.coingeckoId));
    }
  }

  // Stats
  const pass1Count = projects.filter((p) => !p.isEmerging).length;
  const emergingCount = projects.filter((p) => p.isEmerging).length;
  const withMarketCap = projects.filter((p) => p.marketCapUsd !== null).length;
  const categoryBreakdown: Record<string, number> = {};
  for (const p of projects) {
    categoryBreakdown[p.category] = (categoryBreakdown[p.category] ?? 0) + 1;
  }

  logger.info(
    `Phase 1 complete: ${projects.length} projects (${pass1Count} top + ${emergingCount} emerging)`
  );
  logger.info(`Category breakdown: ${JSON.stringify(categoryBreakdown)}`);

  return {
    projects,
    stats: {
      pass1Count,
      emergingCount,
      total: projects.length,
      withMarketCap,
      categoryBreakdown,
    },
    durationMs: Date.now() - start,
  };
}
