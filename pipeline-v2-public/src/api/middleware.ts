// =============================================================================
// ShipOrSkip Pipeline — API Middleware
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { createLogger } from "../shared/logger";

const logger = createLogger("middleware");

/** Log every incoming request */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(`${req.method} ${req.path}`);
  next();
}

/** Require API key on protected endpoints */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-api-key"] ?? req.query["api_key"];
  if (key !== process.env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/** Global error handler */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
}
