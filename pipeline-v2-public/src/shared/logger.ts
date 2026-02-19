// =============================================================================
// ShipOrSkip Pipeline — Structured Logger
// =============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

function fmt(level: LogLevel, module: string, msg: string, data?: unknown): string {
  const prefix = `[${timestamp()}] [${level.toUpperCase().padEnd(5)}] [${module}]`;
  if (data !== undefined) {
    return `${prefix} ${msg} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${msg}`;
}

export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export function createLogger(module: string): Logger {
  return {
    debug(msg: string, data?: unknown) {
      if (shouldLog("debug")) console.debug(fmt("debug", module, msg, data));
    },
    info(msg: string, data?: unknown) {
      if (shouldLog("info")) console.log(fmt("info", module, msg, data));
    },
    warn(msg: string, data?: unknown) {
      if (shouldLog("warn")) console.warn(fmt("warn", module, msg, data));
    },
    error(msg: string, data?: unknown) {
      if (shouldLog("error")) console.error(fmt("error", module, msg, data));
    },
  };
}
