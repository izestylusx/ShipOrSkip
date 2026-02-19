// =============================================================================
// ShipOrSkip Pipeline — Projects Controller
// =============================================================================

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** GET /api/v1/projects */
export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const { verdict, category, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const where: Record<string, unknown> = {};
    if (verdict) where["verdict"] = verdict.toUpperCase();
    if (category) where["category"] = category.toLowerCase();

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { survivalScore: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      db.project.count({ where }),
    ]);

    res.json({
      data: projects,
      meta: { total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) },
    });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
}

/** GET /api/v1/projects/:id */
export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await db.project.findUnique({
      where: { coingeckoId: req.params["id"] },
      include: { snapshots: { orderBy: { snapshotDate: "desc" }, take: 30 } },
    });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to fetch project" });
  }
}

/** GET /api/v1/projects/stats */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [total, shipCount, watchCount, skipCount] = await Promise.all([
      db.project.count(),
      db.project.count({ where: { verdict: "SHIP" } }),
      db.project.count({ where: { verdict: "WATCH" } }),
      db.project.count({ where: { verdict: "SKIP" } }),
    ]);
    const avg = await db.project.aggregate({ _avg: { survivalScore: true } });

    res.json({
      total,
      ship: shipCount,
      watch: watchCount,
      skip: skipCount,
      avgScore: Math.round(avg._avg.survivalScore ?? 0),
    });
  } catch {
    res.status(500).json({ error: "Failed to compute stats" });
  }
}
