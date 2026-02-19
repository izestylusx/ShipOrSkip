// =============================================================================
// ShipOrSkip Pipeline — Cron Scheduler
// =============================================================================

import { createLogger } from "./shared/logger";
import { getConfig } from "./config";
import { runPipeline } from "./pipeline/orchestrator";

const logger = createLogger("scheduler");

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  const config = getConfig();
  logger.info(`Scheduler started (cron: ${config.PIPELINE_SCHEDULE})`);

  try {
    // Dynamic import cron to keep it optional
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CronJob } = require("cron");

    new CronJob(
      config.PIPELINE_SCHEDULE,
      async () => {
        logger.info("Scheduled pipeline run triggered");
        await runPipeline({ triggerType: "scheduled", mode: "full" });
      },
      null,
      true,
      "UTC"
    );
  } catch {
    logger.warn("cron package not found — scheduler disabled. Install with: npm install cron");
  }
}
