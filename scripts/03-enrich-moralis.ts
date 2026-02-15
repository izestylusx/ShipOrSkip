// =============================================================================
// ShipOrSkip Pipeline — Step 03: Enrich via Moralis API
// =============================================================================
// Usage: npx tsx scripts/03-enrich-moralis.ts
// Requires: MORALIS_API_KEY in .env

import "dotenv/config";
import type { SeedProject, MoralisEnrichment } from "./lib/types";
import { readCache, writeCache, isCacheValid } from "./lib/cache";
import { moralisLimiter } from "./lib/rate-limiter";

const API_KEY = process.env.MORALIS_API_KEY;
const BASE_URL = "https://deep-index.moralis.io/api/v2.2";

// Approximate CU costs per endpoint
const CU_COSTS = {
  getTokenPrice: 10,
  getTokenStats: 50,
  getTokenHolders: 10,
  getTokenTopHolders: 10,
} as const;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function moralisGet<T>(
  path: string,
  cuCost: number
): Promise<T | null> {
  if (!API_KEY) {
    console.warn("  ⚠ MORALIS_API_KEY not set — skipping");
    return null;
  }

  try {
    await moralisLimiter.acquire(cuCost);
  } catch {
    return null; // CU limit reached
  }

  try {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": API_KEY,
        accept: "application/json",
      },
    });

    if (res.status === 429) {
      console.warn(`  ⚠ Moralis 429 — backing off`);
      await new Promise((r) => setTimeout(r, 5_000));
      return null;
    }

    if (!res.ok) {
      console.warn(`  ⚠ Moralis ${res.status} for ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`  ⚠ Moralis error for ${path}:`, (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Enrichment for a single token
// ---------------------------------------------------------------------------

async function enrichToken(
  tokenAddress: string
): Promise<MoralisEnrichment | null> {
  const chain = "0x38"; // BSC

  // Token price
  const price = await moralisGet<{
    usdPrice: number;
    "24hrPercentChange": string;
  }>(
    `/erc20/${tokenAddress}/price?chain=${chain}&include=percent_change`,
    CU_COSTS.getTokenPrice
  );

  // Token stats (holders, etc.)
  const stats = await moralisGet<{
    holders: number;
    holderChange30d?: number;
    totalSupply: string;
    circulatingSupply?: string;
  }>(
    `/erc20/${tokenAddress}/stats?chain=${chain}`,
    CU_COSTS.getTokenStats
  );

  // Top holders for concentration
  const topHolders = await moralisGet<{
    result: {
      owner: string;
      balance: string;
      percentage_relative_to_total_supply: number;
    }[];
  }>(
    `/erc20/${tokenAddress}/top-holders?chain=${chain}&limit=10`,
    CU_COSTS.getTokenTopHolders
  );

  if (!price && !stats) return null;

  const top10Pct = topHolders?.result
    ? topHolders.result.reduce(
        (sum, h) => sum + (h.percentage_relative_to_total_supply ?? 0),
        0
      )
    : null;

  return {
    tokenPrice: price?.usdPrice ?? null,
    priceChange24h: price?.["24hrPercentChange"]
      ? parseFloat(price["24hrPercentChange"])
      : null,
    tokenHolders: stats?.holders ?? null,
    holderChange30d: stats?.holderChange30d ?? null,
    top10HolderPct: top10Pct,
    totalSupply: stats?.totalSupply ?? null,
    circulatingSupply: stats?.circulatingSupply ?? null,
    volume24h: null, // Not available from this endpoint
    liquidity: null,
    fdv: null,
    moralisScore: null,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Step 03 — Enrich via Moralis API");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!API_KEY) {
    console.warn("  ⚠ MORALIS_API_KEY not set — skipping step 03");
    return;
  }

  const seeds = readCache<SeedProject[]>("seed-projects");
  if (!seeds) {
    console.error("  ❌ No seed projects found. Run step 01 first.");
    process.exit(1);
  }

  const tokensToEnrich = seeds.filter((s) => s.tokenAddress);
  console.log(`  ↳ tokens to enrich: ${tokensToEnrich.length}`);

  const enrichments: Record<string, MoralisEnrichment> = readCache("moralis-enrichments") ?? {};
  let processed = 0;
  let skipped = 0;

  for (const seed of tokensToEnrich) {
    const cacheKey = `moralis_${seed.id}`;

    // Skip if recently cached (< 6 hours)
    if (isCacheValid(cacheKey, 360)) {
      const cached = readCache<MoralisEnrichment>(cacheKey);
      if (cached) {
        enrichments[seed.id] = cached;
        skipped++;
        continue;
      }
    }

    console.log(
      `  [${++processed}/${tokensToEnrich.length}] ${seed.name} (${seed.tokenAddress?.slice(0, 10)}…) | CU remaining: ${moralisLimiter.remainingCU}`
    );

    const data = await enrichToken(seed.tokenAddress!);
    if (data) {
      enrichments[seed.id] = data;
      writeCache(cacheKey, data);
    }
  }

  // Persist merged results
  writeCache("moralis-enrichments", enrichments);
  console.log(
    `\n  ✔ Moralis enrichment done: ${processed} fetched, ${skipped} cached`
  );
  console.log(`  ↳ CU remaining: ${moralisLimiter.remainingCU}\n`);
}

main().catch((err) => {
  console.error("❌ Step 03 failed:", err);
  process.exit(1);
});
