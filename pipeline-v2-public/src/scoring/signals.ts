// =============================================================================
// ShipOrSkip Pipeline — Whale Signal Detection
// =============================================================================
// 4 whale signal patterns detected from Moralis on-chain + market data.
// =============================================================================

import type { EnrichedProject, WhaleSignal } from "../shared/types";

/**
 * Detect whale signal pattern for a project.
 * Returns null if no signal detected.
 */
export function detectWhaleSignal(project: EnrichedProject): WhaleSignal | null {
  if (!project.resolution.contractAddress) return null;

  const holderCount = project.onChain.holderCount ?? 0;
  const top11Pct = project.onChain.top11HoldersPercent ?? 50;

  // Use 24h + 7d price changes as buy/sell pressure proxy
  const h24 = project.priceChange24h ?? 0;
  const h7 = project.market.priceChange7d ?? 0;
  const buyPressure = h24 * 0.6 + h7 * 0.4;
  const buyRatio = Math.min(1, Math.max(0, 0.5 + buyPressure / 100));

  const contractAddress = project.resolution.contractAddress;

  // ── Signal 1: STEALTH_ACCUMULATION ──
  if (buyRatio > 0.55 && top11Pct > 40) {
    return {
      projectId: project.coingeckoId,
      name: project.name,
      contractAddress,
      holderCount,
      top11HoldersPercent: top11Pct,
      isConcentrated: project.onChain.isConcentrated,
      alertLevel: buyRatio > 0.65 ? "HIGH" : "MEDIUM",
      detectedAt: new Date(),
    };
  }

  // ── Signal 2: ALIGNED_CONVICTION ──
  if (top11Pct < 50 && holderCount > 5_000 && buyRatio > 0.52) {
    return {
      projectId: project.coingeckoId,
      name: project.name,
      contractAddress,
      holderCount,
      top11HoldersPercent: top11Pct,
      isConcentrated: project.onChain.isConcentrated,
      alertLevel: holderCount > 50_000 ? "HIGH" : "MEDIUM",
      detectedAt: new Date(),
    };
  }

  // ── Signal 3: SMART_MONEY_EXIT ──
  if (buyRatio < 0.35 && holderCount > 1_000) {
    return {
      projectId: project.coingeckoId,
      name: project.name,
      contractAddress,
      holderCount,
      top11HoldersPercent: top11Pct,
      isConcentrated: project.onChain.isConcentrated,
      alertLevel: buyRatio < 0.25 ? "HIGH" : "MEDIUM",
      detectedAt: new Date(),
    };
  }

  // ── Signal 4: CONFIRMED_DECLINE ──
  if (holderCount < 50 || buyRatio < 0.25) {
    return {
      projectId: project.coingeckoId,
      name: project.name,
      contractAddress,
      holderCount,
      top11HoldersPercent: top11Pct,
      isConcentrated: project.onChain.isConcentrated,
      alertLevel: "CRITICAL",
      detectedAt: new Date(),
    };
  }

  return null;
}
