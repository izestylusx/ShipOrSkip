// =============================================================================
// ShipOrSkip Pipeline — Pipeline Controller
// =============================================================================

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { runPipeline } from "../pipeline/orchestrator";

const db = new PrismaClient();
let running = false;

/** GET /api/v1/pipeline/status */
export async function getStatus(_req: Request, res: Response): Promise<void> {
  try {
    const latest = await db.pipelineRun.findFirst({ orderBy: { startedAt: "desc" } });
    res.json({ running, latest });
  } catch {
    res.status(500).json({ error: "Failed to fetch pipeline status" });
  }
}

/** POST /api/v1/pipeline/trigger */
export async function triggerPipeline(_req: Request, res: Response): Promise<void> {
  if (running) {
    res.status(409).json({ error: "Pipeline already running" });
    return;
  }

  running = true;
  res.json({ message: "Pipeline triggered", startedAt: new Date().toISOString() });

  runPipeline({ triggerType: "manual" })
    .catch(console.error)
    .finally(() => { running = false; });
}
