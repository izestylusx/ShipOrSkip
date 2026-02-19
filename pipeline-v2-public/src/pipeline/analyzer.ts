// =============================================================================
// ShipOrSkip Pipeline — Phase 4: AI Analysis (xAI Grok)
// =============================================================================
// Generates per-project survival analysis using Grok-3.
// Only runs for new/changed projects to minimize API costs.
// =============================================================================

import { createLogger } from "../shared/logger";
import type { ScoredProject, AiAnalysis, AnalyzedProject } from "../shared/types";

const logger = createLogger("analyzer");

const XAI_API_KEY = process.env.XAI_API_KEY ?? "";
const XAI_BASE = "https://api.x.ai/v1";
const MODEL = process.env.ANALYZER_MODEL ?? "grok-3-mini-fast";
const TIMEOUT_MS = 30_000;
const SCORE_CHANGE_THRESHOLD = 5;

export interface AnalyzerResult {
  projects: AnalyzedProject[];
  stats: { generated: number; skipped: number; failed: number };
  durationMs: number;
}

export async function analyze(
  projects: ScoredProject[],
  previousScores?: Map<string, number>
): Promise<AnalyzerResult> {
  const start = Date.now();
  const stats = { generated: 0, skipped: 0, failed: 0 };
  const analyzed: AnalyzedProject[] = [];

  logger.info(`Phase 4: Analyzing ${projects.length} projects (model: ${MODEL})`);

  if (!XAI_API_KEY) {
    logger.warn("XAI_API_KEY not set — skipping AI analysis");
    return {
      projects: projects.map((p) => ({ ...p, aiAnalysis: null })),
      stats: { generated: 0, skipped: projects.length, failed: 0 },
      durationMs: Date.now() - start,
    };
  }

  for (const project of projects) {
    const prevScore = previousScores?.get(project.coingeckoId);
    const scoreChanged =
      prevScore === undefined ||
      Math.abs(project.scoring.score - prevScore) >= SCORE_CHANGE_THRESHOLD;

    if (!scoreChanged) {
      stats.skipped++;
      analyzed.push({ ...project, aiAnalysis: null });
      continue;
    }

    try {
      const analysis = await generateAnalysis(project);
      analyzed.push({ ...project, aiAnalysis: analysis });
      stats.generated++;
    } catch (err: unknown) {
      logger.warn(`AI analysis failed for ${project.name}`, err);
      analyzed.push({ ...project, aiAnalysis: null });
      stats.failed++;
    }

    // Rate limit politeness
    await sleep(1_000);
  }

  logger.info(
    `Phase 4 complete: generated=${stats.generated} skipped=${stats.skipped} failed=${stats.failed}`
  );

  return { projects: analyzed, stats, durationMs: Date.now() - start };
}

async function generateAnalysis(project: ScoredProject): Promise<AiAnalysis> {
  const isAlive = project.verdict === "SHIP";
  const context = buildContext(project);

  const prompt = isAlive
    ? `You are a blockchain analyst. Based on the data below, write a concise 2-3 sentence "alive summary" for ${project.name} explaining why it is worth shipping/investing in. Be specific and use the data. End with the key risk.\n\n${context}`
    : `You are a blockchain analyst. Based on the data below, write a concise 2-3 sentence "post-mortem" for ${project.name} explaining why it is declining or dead. Be specific and use the data. Focus on what went wrong.\n\n${context}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.4,
      }),
      signal: ctrl.signal,
    });

    clearTimeout(t);

    if (!res.ok) throw new Error(`Grok API ${res.status}`);

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const text = data.choices[0]?.message.content ?? "";

    return {
      aliveSummary: isAlive ? text : null,
      postMortem: !isAlive ? text : null,
      strengths: [],
      risks: [],
      model: MODEL,
      analyzedAt: new Date(),
    };
  } catch (err: unknown) {
    clearTimeout(t);
    throw err;
  }
}

function buildContext(p: ScoredProject): string {
  const lines: string[] = [
    `Project: ${p.name}`,
    `Category: ${p.category}`,
    `Ecosystem Rank: #${p.ecosystemRank} (CoinGecko BNB Chain ecosystem)`,
    `Survival Score: ${p.scoring.score}/100 (${p.scoring.grade})`,
    `Verdict: ${p.verdict}`,
  ];

  if (p.resolution.contractAddress) {
    lines.push(`Token: ${p.resolution.onChainSymbol ?? p.symbol} (${p.resolution.contractAddress})`);
    if (p.market.priceUsd) lines.push(`Price: $${p.market.priceUsd.toFixed(6)}`);
    if (p.marketCapUsd) lines.push(`Market Cap: $${fmt(p.marketCapUsd)}`);
    if (p.market.volume24hUsd) lines.push(`24h Volume: $${fmt(p.market.volume24hUsd)}`);
    if (p.market.priceChange30d !== null) lines.push(`30d Price Change: ${p.market.priceChange30d.toFixed(1)}%`);
    if (p.onChain.holderCount) lines.push(`Holders: ${fmt(p.onChain.holderCount)}`);
    if (p.onChain.top11HoldersPercent !== null) lines.push(`Top-11 Holder %: ${p.onChain.top11HoldersPercent.toFixed(1)}%`);
    lines.push(`Contract verified: ${p.resolution.verified}`);
  }

  lines.push(`\nEcosystem Activity:`);
  lines.push(`  Ecosystem Rank: #${p.ecosystemRank}`);
  if (p.onChain.activeAddresses24h) lines.push(`  Active Addresses (24h): ${fmt(p.onChain.activeAddresses24h)}`);
  if (p.onChain.transfers24h) lines.push(`  Transfers (24h): ${fmt(p.onChain.transfers24h)}`);

  if (p.tvl.tvlUsd !== null) {
    lines.push(`\nTVL: $${fmt(p.tvl.tvlUsd)}`);
    if (p.tvl.tvlChange30d !== null) lines.push(`TVL 30d Change: ${p.tvl.tvlChange30d.toFixed(1)}%`);
  }

  lines.push(`\nFactor Breakdown:`);
  for (const f of p.scoring.factors) {
    if (f.weight > 0) lines.push(`  ${f.key}: ${f.value}/100 (weight: ${f.weight}%)`);
  }

  return lines.join("\n");
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
