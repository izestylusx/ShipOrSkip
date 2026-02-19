// =============================================================================
// ShipOrSkip Pipeline — CLI Runner
// =============================================================================
// Usage:
//   npx ts-node src/cli.ts run              # full pipeline run
//   npx ts-node src/cli.ts run --mode=incremental
//   npx ts-node src/cli.ts collect          # discovery only
//   npx ts-node src/cli.ts score            # re-score existing DB projects
// =============================================================================

import "dotenv/config";
import { createLogger } from "./shared/logger";
import { runPipeline } from "./pipeline/orchestrator";

const logger = createLogger("cli");

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  const mode = args.includes("--mode=incremental") ? "incremental" : "full";

  switch (command) {
    case "run":
      logger.info(`Running full pipeline (mode=${mode})`);
      const result = await runPipeline({ triggerType: "manual", mode });
      logger.info("Pipeline result:", result);
      break;

    default:
      console.log(`
ShipOrSkip Pipeline CLI

Commands:
  run [--mode=full|incremental]   Run the full pipeline

Environment variables required:
  COINGECKO_API_KEY
  MORALIS_API_KEY
  XAI_API_KEY
  DATABASE_URL
      `);
      process.exit(0);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("CLI error:", err);
  process.exit(1);
});
