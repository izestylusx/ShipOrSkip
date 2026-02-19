// =============================================================================
// ShipOrSkip Pipeline — Generic Rate Limiter
// =============================================================================

import type { RateLimiterConfig } from "./types";

/**
 * Token-bucket rate limiter with optional CU (compute-unit) tracking.
 *
 * Profiles:
 *   BSCScan   — 3 req/sec   (windowMs = 1000,  maxRequests = 3)
 *   GeckoTerm — 10 req/min  (windowMs = 60000, maxRequests = 10)  [official free tier]
 *   DexScreen — 300 req/min (windowMs = 60000, maxRequests = 300)
 *   Moralis   — custom CU   (maxCU = 40_000,   cuWindowMs = 86400000)
 */
export class RateLimiter {
  private readonly name: string;
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxCU: number;
  private readonly cuWindowMs: number;

  private timestamps: number[] = [];
  private cuUsed = 0;
  private cuWindowStart: number = Date.now();

  constructor(config: RateLimiterConfig) {
    this.name = config.name;
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.maxCU = config.maxCU ?? Infinity;
    this.cuWindowMs = config.cuWindowMs ?? 86_400_000; // default 24h
  }

  /** Wait until a slot is available, then acquire it. */
  async acquire(cuCost = 0): Promise<void> {
    // Check CU budget first
    if (this.maxCU !== Infinity) {
      const now = Date.now();
      if (now - this.cuWindowStart > this.cuWindowMs) {
        // Reset CU window
        this.cuUsed = 0;
        this.cuWindowStart = now;
      }
      if (this.cuUsed + cuCost > this.maxCU) {
        const remaining = this.cuWindowMs - (now - this.cuWindowStart);
        console.warn(
          `[${this.name}] CU limit reached (${this.cuUsed}/${this.maxCU}). ` +
          `Resets in ${Math.ceil(remaining / 60_000)} min. Skipping.`
        );
        throw new Error(`CU_LIMIT_REACHED`);
      }
    }

    // Sliding-window rate limit
    while (true) {
      const now = Date.now();
      // Purge timestamps outside the window
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(now);
        if (cuCost > 0) {
          this.cuUsed += cuCost;
        }
        return;
      }

      // Wait until the oldest timestamp exits the window
      const oldest = this.timestamps[0]!;
      const waitMs = oldest + this.windowMs - now + 50; // +50ms buffer
      await this.sleep(waitMs);
    }
  }

  /** Release is a no-op for sliding-window; kept for interface symmetry. */
  release(): void {
    // no-op
  }

  /** Remaining CU budget */
  get remainingCU(): number {
    if (this.maxCU === Infinity) return Infinity;
    const now = Date.now();
    if (now - this.cuWindowStart > this.cuWindowMs) return this.maxCU;
    return Math.max(0, this.maxCU - this.cuUsed);
  }

  /** Helper: wait for `ms` milliseconds */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }
}

// ---------------------------------------------------------------------------
// Pre-configured instances
// ---------------------------------------------------------------------------

export const bscscanLimiter = new RateLimiter({
  name: "BSCScan",
  maxRequests: 3,
  windowMs: 1_000,
});

export const geckoTerminalLimiter = new RateLimiter({
  name: "GeckoTerminal",
  maxRequests: 10, // Official free tier: ~10 req/min (verified from CoinGecko docs)
  windowMs: 60_000,
});

export const dexScreenerLimiter = new RateLimiter({
  name: "DexScreener",
  maxRequests: 300,
  windowMs: 60_000,
});

export const moralisLimiter = new RateLimiter({
  name: "Moralis",
  maxRequests: 25,
  windowMs: 1_000,
  maxCU: 40_000,
  cuWindowMs: 86_400_000,
});
