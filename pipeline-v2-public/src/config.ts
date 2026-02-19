// =============================================================================
// ShipOrSkip Pipeline — Configuration
// =============================================================================

import { createLogger } from "./shared/logger";

const logger = createLogger("config");

export interface PipelineConfig {
  // === Required API Keys ===
  COINGECKO_API_KEY: string;
  MORALIS_API_KEY: string;
  XAI_API_KEY: string;

  // === Optional API Keys ===
  TWITTER_BEARER_TOKEN: string;

  // === Pipeline Settings ===
  PIPELINE_PROJECT_LIMIT: number;
  PIPELINE_EMERGING_LIMIT: number;
  PIPELINE_SCHEDULE: string;

  // === Database ===
  DATABASE_URL: string;

  // === API Server ===
  API_PORT: number;
  API_KEY: string;

  // === Scoring ===
  SCORE_SHIP_THRESHOLD: number;
  SCORE_WATCH_THRESHOLD: number;
}

let config: PipelineConfig | null = null;

export function getConfig(): PipelineConfig {
  if (config) return config;

  // Validate required keys
  const required = ["COINGECKO_API_KEY", "MORALIS_API_KEY", "XAI_API_KEY", "DATABASE_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  config = {
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY!,
    MORALIS_API_KEY: process.env.MORALIS_API_KEY!,
    XAI_API_KEY: process.env.XAI_API_KEY!,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN ?? "",
    PIPELINE_PROJECT_LIMIT: parseInt(process.env.PIPELINE_PROJECT_LIMIT ?? "200", 10),
    PIPELINE_EMERGING_LIMIT: parseInt(process.env.PIPELINE_EMERGING_LIMIT ?? "22", 10),
    PIPELINE_SCHEDULE: process.env.PIPELINE_SCHEDULE ?? "0 */6 * * *",
    DATABASE_URL: process.env.DATABASE_URL!,
    API_PORT: parseInt(process.env.API_PORT ?? "4000", 10),
    API_KEY: process.env.API_KEY ?? "changeme",
    SCORE_SHIP_THRESHOLD: parseInt(process.env.SCORE_SHIP_THRESHOLD ?? "60", 10),
    SCORE_WATCH_THRESHOLD: parseInt(process.env.SCORE_WATCH_THRESHOLD ?? "40", 10),
  };

  return config;
}
