// =============================================================================
// ShipOrSkip Pipeline — Server Entry Point
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import { getConfig } from "./config";
import { createLogger } from "./shared/logger";
import router from "./api/router";
import { requestLogger, errorHandler } from "./api/middleware";
import { startScheduler } from "./scheduler";

const logger = createLogger("server");

async function main(): Promise<void> {
  const config = getConfig();
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use("/api/v1", router);
  app.use(errorHandler);

  app.listen(config.API_PORT, () => {
    logger.info(`ShipOrSkip Pipeline API listening on port ${config.API_PORT}`);
    logger.info(`  Health:   http://localhost:${config.API_PORT}/api/v1/health`);
    logger.info(`  Projects: http://localhost:${config.API_PORT}/api/v1/projects`);
    logger.info(`  Status:   http://localhost:${config.API_PORT}/api/v1/pipeline/status`);
  });

  startScheduler();

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => {
      logger.info(`Received ${sig}, shutting down...`);
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
