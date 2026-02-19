// =============================================================================
// ShipOrSkip Pipeline — Phase 1.5: Token Address Resolver
// =============================================================================
// 2-Layer Verification Cascade:
//   Layer 1: CoinGecko /coins/{id} platforms field (primary, 95% reliable)
//   Layer 2: Moralis getTokenMetadata (on-chain verification)
//
// Manual overrides checked FIRST as escape hatch for edge cases.
// =============================================================================

import { createLogger } from "../shared/logger";
import { getBscAddress } from "../sources/coingecko";
import { verifyBscContract } from "../sources/moralis";
import type { DiscoveredProject, TokenResolution } from "../shared/types";

const logger = createLogger("resolver");

// ---------------------------------------------------------------------------
// Manual overrides
// ---------------------------------------------------------------------------

interface ManualOverride {
  coingeckoId: string;
  contractAddress: string;
  symbol: string;
}

/**
 * Add entries here for edge-cases where CoinGecko platforms field is missing
 * or incorrect for BSC, and Moralis cannot auto-resolve.
 */
const MANUAL_OVERRIDES: ManualOverride[] = [
  // Example:
  // { coingeckoId: "seraph", contractAddress: "0xd6b48ccf41a62eb3891e58d0f006b19b01d50cca", symbol: "SERAPH" },
];

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ResolverResult {
  resolutions: Map<string, TokenResolution>;
  stats: {
    total: number;
    resolved: number;
    verified: number;
    manualOverrides: number;
    failed: number;
  };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Phase 1.5: For each discovered project, resolve and verify its BSC token
 * contract address using a 2-layer CoinGecko → Moralis cascade.
 *
 * Results are keyed by coingeckoId.
 */
export async function resolveTokens(
  projects: DiscoveredProject[]
): Promise<ResolverResult> {
  const start = Date.now();
  const resolutions = new Map<string, TokenResolution>();
  const stats = { total: projects.length, resolved: 0, verified: 0, manualOverrides: 0, failed: 0 };

  logger.info(`Phase 1.5: Resolving token addresses for ${projects.length} projects`);

  const overrideMap = new Map<string, ManualOverride>(
    MANUAL_OVERRIDES.map((o) => [o.coingeckoId.toLowerCase(), o])
  );

  for (const project of projects) {
    const cid = project.coingeckoId.toLowerCase();

    // 1. Manual override
    const override = overrideMap.get(cid);
    if (override) {
      logger.info(`Override: ${project.name} → ${override.contractAddress}`);
      const verified = await verifyBscContract(override.contractAddress);
      resolutions.set(project.coingeckoId, {
        ...verified,
        source: "manual",
        contractAddress: override.contractAddress,
      });
      stats.resolved++;
      stats.manualOverrides++;
      if (verified.verified) stats.verified++;
      continue;
    }

    // 2. CoinGecko platforms field
    const bscAddr = await getBscAddress(project.coingeckoId);

    if (!bscAddr) {
      // No BSC token for this project
      resolutions.set(project.coingeckoId, {
        contractAddress: null,
        source: null,
        verified: false,
        onChainName: null,
        onChainSymbol: null,
        totalSupply: null,
        decimals: null,
        error: "No BSC address in CoinGecko platforms",
      });
      stats.failed++;
      continue;
    }

    stats.resolved++;

    // 3. Moralis verification
    const resolution = await verifyBscContract(bscAddr);
    resolutions.set(project.coingeckoId, resolution);
    if (resolution.verified) stats.verified++;
  }

  logger.info(
    `Phase 1.5 complete: ${stats.resolved} resolved, ${stats.verified} verified, ${stats.failed} no-token`
  );

  return { resolutions, stats, durationMs: Date.now() - start };
}
