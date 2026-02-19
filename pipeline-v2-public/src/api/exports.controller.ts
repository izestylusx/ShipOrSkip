// =============================================================================
// ShipOrSkip Pipeline — Exports Controller
// =============================================================================

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** GET /api/v1/exports/latest — returns latest scored projects as JSON export */
export async function getLatestExport(_req: Request, res: Response): Promise<void> {
  try {
    const run = await db.pipelineRun.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
    });

    const projects = await db.project.findMany({
      orderBy: { survivalScore: "desc" },
      select: {
        coingeckoId: true,
        name: true,
        symbol: true,
        category: true,
        ecosystemRank: true,
        verdict: true,
        survivalScore: true,
        grade: true,
        tokenAddress: true,
        marketCapUsd: true,
        priceUsd: true,
        volume24hUsd: true,
        holderCount: true,
        tvlUsd: true,
        aliveSummary: true,
        postMortem: true,
        enrichedAt: true,
      },
    });

    res.json({
      exportedAt: new Date().toISOString(),
      lastRunAt: run?.completedAt ?? null,
      count: projects.length,
      projects,
    });
  } catch {
    res.status(500).json({ error: "Failed to generate export" });
  }
}
