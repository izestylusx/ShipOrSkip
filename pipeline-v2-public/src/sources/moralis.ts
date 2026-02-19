// =============================================================================
// ShipOrSkip Pipeline — Moralis Web3 API Source
// On-chain data: contract verification, holder counts, transfer activity
// =============================================================================

import axios, { AxiosInstance } from "axios";
import { createLogger } from "../shared/logger";
import { moralisLimiter } from "../shared/rate-limiter";
import {
  MoralisTokenMetadata,
  MoralisTokenHolder,
  MoralisTransfer,
  TokenResolution,
  OnChainMetrics,
} from "../shared/types";

const logger = createLogger("moralis");

const MORALIS_BASE =
  process.env.MORALIS_BASE_URL ?? "https://deep-index.moralis.io/api/v2.2";
const BSC_CHAIN = "0x38"; // BSC mainnet chain ID

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (client) return client;

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error("MORALIS_API_KEY is not set");
  }

  client = axios.create({
    baseURL: MORALIS_BASE,
    timeout: 15_000,
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  client.interceptors.request.use(async (config) => {
    await moralisLimiter.acquire();
    return config;
  });

  return client;
}

// ---------------------------------------------------------------------------
// Contract Verification
// ---------------------------------------------------------------------------

/**
 * Fetches ERC-20 metadata for a BSC contract address.
 * Returns null if the address is not a valid ERC-20 token on BSC.
 */
export async function getTokenMetadata(
  address: string
): Promise<MoralisTokenMetadata | null> {
  try {
    const { data } = await getClient().get<MoralisTokenMetadata[]>(
      "/erc20/metadata",
      {
        params: {
          chain: BSC_CHAIN,
          addresses: [address],
        },
      }
    );
    return data?.[0] ?? null;
  } catch (err: unknown) {
    logger.warn(`getTokenMetadata failed for ${address}`, err);
    return null;
  }
}

/**
 * Verifies that a BSC contract is a valid ERC-20 token and returns a
 * TokenResolution object ready for the pipeline.
 */
export async function verifyBscContract(address: string): Promise<TokenResolution> {
  const meta = await getTokenMetadata(address);

  if (!meta) {
    return {
      contractAddress: address,
      source: "moralis",
      verified: false,
      onChainName: null,
      onChainSymbol: null,
      totalSupply: null,
      decimals: null,
      error: "Contract not found or not ERC-20 on BSC",
    };
  }

  return {
    contractAddress: address,
    source: "moralis",
    verified: meta.verified_contract,
    onChainName: meta.name,
    onChainSymbol: meta.symbol,
    totalSupply: meta.total_supply,
    decimals: parseInt(meta.decimals, 10),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Token Holders
// ---------------------------------------------------------------------------

/**
 * Fetches top N token holders for a BSC ERC-20 contract.
 * Default limit = 11 (enough to compute top-11 concentration).
 */
export async function getTokenHolders(
  address: string,
  limit = 11
): Promise<MoralisTokenHolder[]> {
  try {
    const { data } = await getClient().get<{
      result: MoralisTokenHolder[];
      cursor: string | null;
    }>(`/erc20/${address}/owners`, {
      params: {
        chain: BSC_CHAIN,
        limit,
        order: "DESC", // by balance
      },
    });
    return data.result ?? [];
  } catch (err: unknown) {
    logger.warn(`getTokenHolders failed for ${address}`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Transfer Activity
// ---------------------------------------------------------------------------

/**
 * Fetches ERC-20 transfer events since a given ISO date string.
 * Used to compute 24h active addresses and transfer count.
 */
export async function getTokenTransfers(
  address: string,
  since: string, // ISO 8601
  limit = 500
): Promise<MoralisTransfer[]> {
  try {
    const { data } = await getClient().get<{
      result: MoralisTransfer[];
      cursor: string | null;
    }>(`/erc20/${address}/transfers`, {
      params: {
        chain: BSC_CHAIN,
        from_date: since,
        limit,
      },
    });
    return data.result ?? [];
  } catch (err: unknown) {
    logger.warn(`getTokenTransfers failed for ${address}`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Composite On-chain Enrichment
// ---------------------------------------------------------------------------

/**
 * Main enrichment function — mirrors the interface once provided by NodeReal.
 * Fetches holders + 24h transfers and returns OnChainMetrics.
 */
export async function enrichOnChain(contractAddress: string): Promise<OnChainMetrics> {
  const [holders, transfers] = await Promise.all([
    getTokenHolders(contractAddress, 11),
    getTokenTransfers(
      contractAddress,
      new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString(),
      500
    ),
  ]);

  // Holder count — Moralis /owners endpoint returns cursor-paginated results.
  // We fetch 11 for concentration check; real count requires a separate call.
  const holderCount = await getTotalHolderCount(contractAddress);

  // Top-11 concentration
  let top11Percent: number | null = null;
  if (holders.length > 0) {
    top11Percent = holders.reduce((sum, h) => {
      return sum + parseFloat(h.percentage_relative_to_total_supply ?? "0");
    }, 0);
  }

  // Concentration flag: >80% held by top-5
  const top5Percent =
    holders.slice(0, 5).reduce((sum, h) => {
      return sum + parseFloat(h.percentage_relative_to_total_supply ?? "0");
    }, 0);
  const isConcentrated = top5Percent > 80;

  // Transfer activity proxies
  const transfers24h = transfers.length;
  const activeAddresses24h = new Set(transfers.map((t) => t.from_address)).size;

  return {
    holderCount,
    top11HoldersPercent: top11Percent,
    isConcentrated,
    transfers24h,
    activeAddresses24h,
  };
}

/**
 * Fetches total holder count using the token owners endpoint with limit=1
 * to read the total field from the response header/body if available.
 * Falls back to null if not supported.
 */
async function getTotalHolderCount(address: string): Promise<number | null> {
  try {
    const { data } = await getClient().get<{
      result: MoralisTokenHolder[];
      total: number | null;
    }>(`/erc20/${address}/owners`, {
      params: {
        chain: BSC_CHAIN,
        limit: 1,
      },
    });
    return data.total ?? null;
  } catch {
    return null;
  }
}
