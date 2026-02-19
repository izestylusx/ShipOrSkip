// =============================================================================
// ShipOrSkip Pipeline — Pipeline Orchestrator
// =============================================================================
// Phases:
//   1      Collect     (CoinGecko — bnb-chain-ecosystem discovery)
//   1.5    Resolve     (CoinGecko platforms → Moralis contract verification)
//   2      Enrich      (DeFiLlama + Moralis on-chain + CoinGecko OHLCV)
//   2.5    Social      (Twitter/Grok last-post detection)
//   3      Score       (13 factors, 7 weight profiles)
//   4      Analyze     (xAI Grok aliveSummary / postMortem)
//   5      Store       (PostgreSQL upsert + snapshots)
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { createLogger } from "../shared/logger";
import { getConfig } from "../config";
import { collect } from "./collector";
import { resolveTokens } from "./resolver";
import { enrich } from "./enricher";
import { enrichTwitterActivity } from "./twitter-enricher";
import { score } from "./scorer";
import { analyze } from "./analyzer";
import { store, disconnect } from "./store";

const logger = createLogger("orchestrator");

export interface PipelineOptions {
  triggerType?: "scheduled" | "manual";
  mode?: "full" | "incremental";
  projectLimit?: number;
}

export interface PipelineRunResult {
  runId: number;
  status: "completed" | "failed";
  projectsDiscovered: number;
  projectsEnriched: number;
  projectsScored: number;
  moralisEnriched: number;
  marketDataEnriched: number;
  errors: string[];
  durationTotalS: number;
}

export async function runPipeline(
  options: PipelineOptions = {}
): Promise<PipelineRunResult> {
  const { triggerType = "scheduled", mode = "full" } = options;
  const config = getConfig();
  const db = new PrismaClient();
  const errors: string[] = [];
  const startTime = Date.now();

  logger.info("=".repeat(60));
  logger.info(`Pipeline starting — trigger=${triggerType} mode=${mode}`);
  logger.info("=".repeat(60));

  // Create run record
  const run = await db.pipelineRun.create({
    data: { startedAt: new Date(), status: "running", triggerType },
  });

  try {
    // ── Phase 1: Collect ──────────────────────────────────────────────────
    logger.info("--- Phase 1: Collect (CoinGecko) ---");
    const { projects: discovered, stats: collectStats } = await collect({
      topN: options.projectLimit ?? config.PIPELINE_PROJECT_LIMIT,
      emergingLimit: config.PIPELINE_EMERGING_LIMIT,
      mode,
    });

    await db.pipelineRun.update({
      where: { id: run.id },
      data: { projectsDiscovered: discovered.length },
    });

    // ── Phase 1.5: Resolve ────────────────────────────────────────────────
    logger.info("--- Phase 1.5: Resolve (CoinGecko → Moralis) ---");
    const { resolutions } = await resolveTokens(discovered);

    // ── Phase 2: Enrich ───────────────────────────────────────────────────
    logger.info("--- Phase 2: Enrich (DeFiLlama + Moralis + CoinGecko OHLCV) ---");
    const { projects: enriched, stats: enrichStats } = await enrich(
      discovered,
      resolutions
    );

    await db.pipelineRun.update({
      where: { id: run.id },
      data: {
        moralisEnriched: enrichStats.moralisEnriched,
        marketDataEnriched: enrichStats.marketDataEnriched,
      },
    });

    // ── Phase 2.5: Social (Twitter/Grok) ─────────────────────────────────
    logger.info("--- Phase 2.5: Social (Twitter/Grok) ---");
    const { projects: socialEnriched } = await enrichTwitterActivity(enriched);

    // ── Phase 3: Score ────────────────────────────────────────────────────
    logger.info("--- Phase 3: Score ---");
    const { projects: scored, stats: scoreStats } = await score(socialEnriched);

    await db.pipelineRun.update({
      where: { id: run.id },
      data: { projectsScored: scored.length },
    });

    logger.info(
      `Score distribution: SHIP=${scoreStats.ship} WATCH=${scoreStats.watch} SKIP=${scoreStats.skip} avg=${scoreStats.avgScore}`
    );

    // ── Phase 4: Analyze (Grok AI) ────────────────────────────────────────
    logger.info("--- Phase 4: Analyze (xAI Grok) ---");
    const { projects: analyzed, stats: analyzeStats } = await analyze(scored);

    logger.info(
      `AI analysis: generated=${analyzeStats.generated} skipped=${analyzeStats.skipped} failed=${analyzeStats.failed}`
    );

    // ── Phase 5: Store ────────────────────────────────────────────────────
    logger.info("--- Phase 5: Store (PostgreSQL) ---");
    const { upserted, snapshots } = await store(analyzed, run.id);

    // Finalize run record
    const durationTotalS = (Date.now() - startTime) / 1_000;
    await db.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        durationS: durationTotalS,
        projectsUpserted: upserted,
        snapshotsCreated: snapshots,
        errors: errors,
      },
    });

    logger.info("=".repeat(60));
    logger.info(
      `Pipeline complete in ${durationTotalS.toFixed(1)}s: ${upserted} upserted, ${snapshots} snapshots`
    );
    logger.info("=".repeat(60));

    return {
      runId: run.id,
      status: "completed",
      projectsDiscovered: discovered.length,
      projectsEnriched: enriched.length,
      projectsScored: scored.length,
      moralisEnriched: enrichStats.moralisEnriched,
      marketDataEnriched: enrichStats.marketDataEnriched,
      errors,
      durationTotalS,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Pipeline failed: ${msg}`, err);
    errors.push(msg);

    await db.pipelineRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date(), errors },
    });

    return {
      runId: run.id,
      status: "failed",
      projectsDiscovered: 0,
      projectsEnriched: 0,
      projectsScored: 0,
      moralisEnriched: 0,
      marketDataEnriched: 0,
      errors,
      durationTotalS: (Date.now() - startTime) / 1_000,
    };
  } finally {
    await disconnect();
    await db.$disconnect();
  }
}
