// =============================================================================
// ShipOrSkip Pipeline — Phase 5: Store
// =============================================================================
// Upserts analyzed projects into PostgreSQL via Prisma + creates snapshots.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { createLogger } from "../shared/logger";
import type { AnalyzedProject } from "../shared/types";

const logger = createLogger("store");

let prisma: PrismaClient | null = null;

function getDb(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export interface StoreResult {
  upserted: number;
  snapshots: number;
  durationMs: number;
}

export async function store(
  projects: AnalyzedProject[],
  pipelineRunId: number
): Promise<StoreResult> {
  const start = Date.now();
  const db = getDb();
  let upserted = 0;
  let snapshots = 0;

  logger.info(`Phase 5: Storing ${projects.length} projects (runId=${pipelineRunId})`);

  for (const project of projects) {
    const slug = project.coingeckoId; // use coingeckoId as stable slug

    try {
      const data = {
        name: project.name,
        symbol: project.symbol,
        coingeckoId: project.coingeckoId,
        imageUrl: project.imageUrl,
        category: project.category,
        ecosystemRank: project.ecosystemRank,
        isEmerging: project.isEmerging,

        // Token (Moralis-verified)
        tokenAddress: project.resolution.contractAddress,
        tokenVerified: project.resolution.verified,
        tokenSymbol: project.resolution.onChainSymbol,
        totalSupply: project.resolution.totalSupply,
        decimals: project.resolution.decimals,

        // On-chain (Moralis)
        holderCount: project.onChain.holderCount,
        top11HoldersPercent: project.onChain.top11HoldersPercent,
        isConcentrated: project.onChain.isConcentrated,
        transfers24h: project.onChain.transfers24h,
        activeAddresses24h: project.onChain.activeAddresses24h,

        // Market (CoinGecko)
        priceUsd: project.market.priceUsd,
        volume24hUsd: project.market.volume24hUsd,
        liquidityUsd: project.market.liquidityUsd,
        marketCapUsd: project.marketCapUsd,
        priceChange24h: project.priceChange24h,
        priceChange7d: project.market.priceChange7d,
        priceChange30d: project.market.priceChange30d,
        ath: project.market.ath,
        athDrawdownPercent: project.market.athDrawdownPercent,

        // TVL (DeFiLlama)
        defiLlamaSlug: project.tvl.defiLlamaSlug,
        tvlUsd: project.tvl.tvlUsd,
        tvlChange7d: project.tvl.tvlChange7d,
        tvlChange30d: project.tvl.tvlChange30d,

        // Social
        twitterFollowers: project.social.twitterFollowers,
        sentimentScore: project.social.sentimentScore,

        // Scoring
        survivalScore: project.scoring.score,
        grade: project.scoring.grade,
        verdict: project.verdict,
        scoringProfile: project.scoring.profile,
        factors: project.scoring.factors as unknown as object,

        // AI Analysis
        aliveSummary: project.aiAnalysis?.aliveSummary,
        postMortem: project.aiAnalysis?.postMortem,
        aiModel: project.aiAnalysis?.model,

        // Enrichment flags
        moralisEnriched: project.moralisEnriched,
        marketDataEnriched: project.marketDataEnriched,
        socialEnriched: project.socialEnriched,
        tvlEnriched: project.tvlEnriched,

        enrichedAt: project.enrichedAt,
        lastScoredAt: project.scoring.scoredAt,
      };

      await db.project.upsert({
        where: { coingeckoId: slug },
        create: { ...data, createdAt: new Date() },
        update: { ...data, updatedAt: new Date() },
      });

      upserted++;
    } catch (err: unknown) {
      logger.error(`Failed to upsert "${project.name}"`, err);
    }

    // Daily snapshot
    try {
      const today = new Date().toISOString().split("T")[0]!;
      await db.projectSnapshot.upsert({
        where: {
          projectCoingeckoId_snapshotDate: {
            projectCoingeckoId: slug,
            snapshotDate: new Date(today),
          },
        },
        create: {
          projectCoingeckoId: slug,
          snapshotDate: new Date(today),
          survivalScore: project.scoring.score,
          holderCount: project.onChain.holderCount,
          priceUsd: project.market.priceUsd,
          volume24hUsd: project.market.volume24hUsd,
          tvlUsd: project.tvl.tvlUsd,
          transfers24h: project.onChain.transfers24h,
          pipelineRunId,
        },
        update: {
          survivalScore: project.scoring.score,
          holderCount: project.onChain.holderCount,
          priceUsd: project.market.priceUsd,
          volume24hUsd: project.market.volume24hUsd,
          tvlUsd: project.tvl.tvlUsd,
          transfers24h: project.onChain.transfers24h,
        },
      });
      snapshots++;
    } catch (err: unknown) {
      logger.error(`Failed to snapshot "${project.name}"`, err);
    }
  }

  const dur = Date.now() - start;
  logger.info(
    `Phase 5 complete in ${(dur / 1000).toFixed(1)}s: ${upserted} upserted, ${snapshots} snapshots`
  );

  return { upserted, snapshots, durationMs: dur };
}

export async function disconnect(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
