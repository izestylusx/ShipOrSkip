// =============================================================================
// ShipOrSkip Pipeline — DeFiLlama API Client
// Purpose: TVL enrichment for DeFi-category projects
// Auth: none (public API)
// Rate: generous — no official limit, ~600/min is safe
// =============================================================================

import { createLogger } from "../shared/logger";
import { TvlMetrics } from "../shared/types";
import { defiLlamaLimiter } from "../shared/rate-limiter";

const logger = createLogger("defillama");

const DEFILLAMA_BASE = "https://api.llama.fi";

// ---------------------------------------------------------------------------
// Protocol list cache
// ---------------------------------------------------------------------------

interface DeFiLlamaProtocol {
  name: string;
  slug: string;
  chains: string[];
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
}

let protocolCache: DeFiLlamaProtocol[] | null = null;

export async function fetchProtocolList(): Promise<DeFiLlamaProtocol[]> {
  if (protocolCache) return protocolCache;

  logger.info("Fetching DeFiLlama protocol list...");
  await defiLlamaLimiter.acquire();

  const res = await fetch(`${DEFILLAMA_BASE}/protocols`);
  if (!res.ok) throw new Error(`DeFiLlama /protocols error: ${res.status}`);

  const data = (await res.json()) as DeFiLlamaProtocol[];
  protocolCache = data.filter((p) =>
    p.chains.some(
      (c) =>
        c.toLowerCase() === "bsc" || c.toLowerCase() === "binance"
    )
  );
  logger.info(`DeFiLlama: ${data.length} total, ${protocolCache.length} on BSC`);
  return protocolCache;
}

export function clearProtocolCache(): void {
  protocolCache = null;
}

// ---------------------------------------------------------------------------
// Slug matching
// ---------------------------------------------------------------------------

export async function findSlug(projectName: string): Promise<string | null> {
  const protocols = await fetchProtocolList();
  const nameLower = projectName.toLowerCase().replace(/[\s\-_.]/g, "");

  const exact = protocols.find(
    (p) =>
      p.slug.toLowerCase() === nameLower ||
      p.name.toLowerCase().replace(/[\s\-_.]/g, "") === nameLower
  );
  if (exact) return exact.slug;

  const partial = protocols.find((p) => {
    const pName = p.name.toLowerCase().replace(/[\s\-_.]/g, "");
    return pName.includes(nameLower) || nameLower.includes(pName);
  });
  if (partial) {
    logger.debug(`Fuzzy match: "${projectName}" → "${partial.slug}"`);
    return partial.slug;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Per-protocol TVL detail
// ---------------------------------------------------------------------------

interface DeFiLlamaProtocolDetail {
  name: string;
  slug: string;
  tvl: { date: number; totalLiquidityUSD: number }[];
  currentChainTvls?: Record<string, number>;
}

export async function fetchTvl(slug: string): Promise<TvlMetrics | null> {
  logger.debug(`Fetching DeFiLlama TVL for: ${slug}`);
  await defiLlamaLimiter.acquire();

  try {
    const res = await fetch(`${DEFILLAMA_BASE}/protocol/${slug}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      logger.warn(`DeFiLlama /protocol/${slug} error: ${res.status}`);
      return null;
    }

    const detail = (await res.json()) as DeFiLlamaProtocolDetail;
    const bscTvl =
      detail.currentChainTvls?.["BSC"] ??
      detail.currentChainTvls?.["Binance"] ??
      null;
    const series = detail.tvl ?? [];
    const values = series.map((d) => d.totalLiquidityUSD);

    const tvlUsd = bscTvl ?? (values.length > 0 ? values[values.length - 1]! : null);
    const now = values[values.length - 1] ?? 0;
    const d7 = values[values.length - 8] ?? now;
    const d30 = values[values.length - 31] ?? now;

    return {
      tvlUsd,
      tvlChange7d: d7 > 0 ? ((now - d7) / d7) * 100 : null,
      tvlChange30d: d30 > 0 ? ((now - d30) / d30) * 100 : null,
      defiLlamaSlug: slug,
    };
  } catch (err: unknown) {
    logger.error(`DeFiLlama fetchTvl error for ${slug}`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Composite enrichment: find slug + fetch TVL
// ---------------------------------------------------------------------------

export async function enrichTvl(projectName: string): Promise<TvlMetrics> {
  const empty: TvlMetrics = {
    tvlUsd: null,
    tvlChange7d: null,
    tvlChange30d: null,
    defiLlamaSlug: null,
  };

  const slug = await findSlug(projectName);
  if (!slug) return empty;

  const tvl = await fetchTvl(slug);
  return tvl ?? empty;
}
