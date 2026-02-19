// =============================================================================
// ShipOrSkip Pipeline — Token-Bucket Rate Limiter
// =============================================================================

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(requestsPerMinute: number, burst?: number) {
    this.capacity = burst ?? requestsPerMinute;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60_000;
  }

  /**
   * Wait until a token is available, then consume it.
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
          resolve();
        } else {
          const waitMs = Math.ceil((1 - this.tokens) / this.refillRate);
          setTimeout(check, Math.min(waitMs, 100));
        }
      };
      check();
    });
  }

  /**
   * Non-blocking check — true if a token is available right now.
   */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const added = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + added);
    this.lastRefill = now;
  }

  /** Estimated wait in ms before next token is available */
  estimatedWaitMs(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }
}

// ---------------------------------------------------------------------------
// Pre-configured rate limiters for each external API
// ---------------------------------------------------------------------------

/**
 * CoinGecko Pro API — 500 calls/min (demo key: ~30/min; Pro: 500/min)
 * We default conservatively to 30/min to work with free demo keys.
 * Override at runtime via COINGECKO_RPM env var.
 */
export const coingeckoLimiter = new RateLimiter(
  parseInt(process.env.COINGECKO_RPM ?? "30", 10)
);

/**
 * Moralis Web3 API — 25 req/sec free tier (1 500/min)
 */
export const moralisLimiter = new RateLimiter(1_500, 25);

/**
 * DeFiLlama — public, no key needed; 10 req/s to be polite
 */
export const defiLlamaLimiter = new RateLimiter(600, 10);

/**
 * xAI Grok — 60 req/min generous default
 */
export const grokLimiter = new RateLimiter(60, 5);

/**
 * Twitter API v2 — 15 req/15 min search endpoint
 */
export const twitterLimiter = new RateLimiter(15, 1);
