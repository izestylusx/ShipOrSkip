// =============================================================================
// ShipOrSkip Pipeline — API Router
// =============================================================================

import { Router } from "express";
import { listProjects, getProject, getStats } from "./projects.controller";
import { getStatus, triggerPipeline } from "./pipeline.controller";
import { getLatestExport } from "./exports.controller";
import { requireApiKey } from "./middleware";

const router = Router();

// Projects
router.get("/projects", listProjects);
router.get("/projects/stats", getStats);
router.get("/projects/:id", getProject);

// Pipeline
router.get("/pipeline/status", getStatus);
router.post("/pipeline/trigger", requireApiKey, triggerPipeline);

// Exports
router.get("/exports/latest", getLatestExport);

// Health
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
