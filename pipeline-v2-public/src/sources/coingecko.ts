// =============================================================================
// ShipOrSkip Pipeline — CoinGecko Pro API Source
// Handles both ecosystem discovery and price/OHLCV enrichment
// =============================================================================

import axios, { AxiosInstance } from "axios";
import { createLogger } from "../shared/logger";
import { coingeckoLimiter } from "../shared/rate-limiter";
import {
  CoinGeckoMarketItem,
  CoinGeckoCoinDetail,
  DiscoveredProject,
} from "../shared/types";
import { mapCoinGeckoCategory } from "../shared/category-map";

const logger = createLogger("coingecko");

const COINGECKO_BASE =
  process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3";
const BSC_CATEGORY = "bnb-chain-ecosystem";

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (client) return client;

  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) {
    throw new Error("COINGECKO_API_KEY is not set");
  }

  client = axios.create({
    baseURL: COINGECKO_BASE,
    timeout: 20_000,
    headers: {
      "x-cg-pro-api-key": apiKey,
      Accept: "application/json",
    },
  });

  // Attach rate limiter to every request
  client.interceptors.request.use(async (config) => {
    await coingeckoLimiter.acquire();
    return config;
  });

  return client;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

/**
 * Pass 1 — top 200 BNB-chain projects by market cap.
 * Maps CoinGecko's /coins/markets response to DiscoveredProject[].
 */
async function discoverTopByMarketCap(perPage = 200): Promise<CoinGeckoMarketItem[]> {
  logger.info(`Fetching top ${perPage} BNB ecosystem projects by market cap`);

  const { data } = await getClient().get<CoinGeckoMarketItem[]>("/coins/markets", {
    params: {
      vs_currency: "usd",
      category: BSC_CATEGORY,
      order: "market_cap_desc",
      per_page: perPage,
      page: 1,
      sparkline: false,
      price_change_percentage: "7d",
    },
  });

  logger.info(`CoinGecko returned ${data.length} projects (pass 1)`);
  return data;
}

/**
 * Pass 2 — 50 lowest-volume projects (emerging / potentially undervalued).
 * Returns up to `limit` unique items not already in the top-200 set.
 */
async function discoverEmerging(
  existingIds: Set<string>,
  limit = 22
): Promise<CoinGeckoMarketItem[]> {
  logger.info(`Fetching emerging BNB ecosystem projects (pass 2, limit=${limit})`);

  const { data } = await getClient().get<CoinGeckoMarketItem[]>("/coins/markets", {
    params: {
      vs_currency: "usd",
      category: BSC_CATEGORY,
      order: "volume_asc",
      per_page: 50,
      page: 1,
      sparkline: false,
    },
  });

  const unique = data.filter((c) => !existingIds.has(c.id)).slice(0, limit);
  logger.info(`Emerging pass returned ${unique.length} unique projects`);
  return unique;
}

/**
 * Full discovery entrypoint — two-pass strategy.
 * Returns array of DiscoveredProject ready for Phase 1.5 token resolution.
 */
export async function discoverProjects(options?: {
  topN?: number;
  emergingLimit?: number;
}): Promise<DiscoveredProject[]> {
  const topN = options?.topN ?? 200;
  const emergingLimit =
    options?.emergingLimit ??
    parseInt(process.env.PIPELINE_EMERGING_LIMIT ?? "22", 10);

  const pass1 = await discoverTopByMarketCap(topN);
  const pass1Ids = new Set(pass1.map((c) => c.id));
  const pass2 = await discoverEmerging(pass1Ids, emergingLimit);

  const allItems = [
    ...pass1.map((c, i) => ({ item: c, rank: i + 1, isEmerging: false })),
    ...pass2.map((c, i) => ({
      item: c,
      rank: topN + i + 1,
      isEmerging: true,
    })),
  ];

  return allItems.map(({ item, rank, isEmerging }) =>
    marketItemToDiscovered(item, rank, isEmerging)
  );
}

function marketItemToDiscovered(
  item: CoinGeckoMarketItem,
  rank: number,
  isEmerging: boolean
): DiscoveredProject {
  return {
    coingeckoId: item.id,
    name: item.name,
    symbol: item.symbol.toUpperCase(),
    ecosystemRank: rank,
    hasToken: true, // CoinGecko only lists projects with a token
    volume7d: null, // not returned by /coins/markets directly; enriched later
    marketCapUsd: item.market_cap,
    priceChange24h: item.price_change_percentage_24h,
    imageUrl: item.image,
    coinGeckoCategories: [], // populated during detail fetch if needed
    category: mapCoinGeckoCategory(null), // refined after /coins/{id} call
    isEmerging,
    discoveredAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Token Resolution — resolve BSC contract address from CoinGecko coin detail
// ---------------------------------------------------------------------------

const BSC_PLATFORM_KEYS = [
  "binance-smart-chain",
  "bnb-smart-chain",
  "binancecoin",
  "bsc",
];

/**
 * Fetches /coins/{id} and extracts the BSC contract address from `platforms`.
 * Returns null if no BSC address is found.
 */
export async function getBscAddress(coinId: string): Promise<string | null> {
  try {
    const detail = await getCoinDetail(coinId);
    for (const key of BSC_PLATFORM_KEYS) {
      const addr = detail.platforms[key];
      if (addr) return addr;
    }
    return null;
  } catch (err: unknown) {
    logger.warn(`Failed to get BSC address for ${coinId}`, err);
    return null;
  }
}

/**
 * Full coin detail — used by resolver to get platforms + categories.
 */
export async function getCoinDetail(coinId: string): Promise<CoinGeckoCoinDetail> {
  const { data } = await getClient().get<CoinGeckoCoinDetail>(`/coins/${coinId}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
    },
  });
  return data;
}

/**
 * Legacy helper — search by name/symbol when coinId unknown.
 * Returns first BSC contract address match or null.
 */
export async function searchBscAddress(
  name: string,
  symbol: string
): Promise<string | null> {
  try {
    const { data } = await getClient().get<{
      coins: { id: string; name: string; symbol: string }[];
    }>("/search", { params: { query: name } });

    const match = data.coins.find(
      (c) =>
        c.symbol.toLowerCase() === symbol.toLowerCase() ||
        c.name.toLowerCase() === name.toLowerCase()
    );
    if (!match) return null;

    return getBscAddress(match.id);
  } catch (err: unknown) {
    logger.warn(`CoinGecko search failed for ${name} (${symbol})`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Price / OHLCV Enrichment
// ---------------------------------------------------------------------------

export interface OhlcvData {
  priceUsd: number | null;
  volume24hUsd: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  ath: number | null;
  athDrawdownPercent: number | null;
  liquidityProxyUsd: number | null; // total_volume * 0.1 heuristic
}

/**
 * Fetches market data for enrichment phase.
 * Uses /coins/{id} market_data which we already have from resolution.
 */
export async function getMarketData(coinId: string): Promise<OhlcvData> {
  try {
    const detail = await getCoinDetail(coinId);
    const md = detail.market_data;
    const priceUsd = md.current_price?.usd ?? null;
    const volumeUsd = md.total_volume?.usd ?? null;
    const ath = md.ath?.usd ?? null;

    return {
      priceUsd,
      volume24hUsd: volumeUsd,
      priceChange7d: md.price_change_percentage_7d ?? null,
      priceChange30d: md.price_change_percentage_30d ?? null,
      ath,
      athDrawdownPercent:
        ath && priceUsd ? ((ath - priceUsd) / ath) * 100 : null,
      liquidityProxyUsd: volumeUsd ? volumeUsd * 0.1 : null,
    };
  } catch (err: unknown) {
    logger.warn(`getMarketData failed for ${coinId}`, err);
    return {
      priceUsd: null,
      volume24hUsd: null,
      priceChange7d: null,
      priceChange30d: null,
      ath: null,
      athDrawdownPercent: null,
      liquidityProxyUsd: null,
    };
  }
}
