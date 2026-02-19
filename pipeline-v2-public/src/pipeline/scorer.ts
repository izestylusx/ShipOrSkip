// =============================================================================
// ShipOrSkip Pipeline — Phase 3: Scorer
// =============================================================================
// Category-adaptive scoring: 13 factors, 7 weight profiles.
// Two-pass: pass 1 scores all projects; pass 2 fills in categoryHealth.
// =============================================================================

import { createLogger } from "../shared/logger";
import { getWeights } from "../scoring/weights";
import { computeFactors } from "../scoring/factors";
import { detectWhaleSignal } from "../scoring/signals";
import { getConfig } from "../config";
import type { EnrichedProject, ScoredProject, ScoreResult, Verdict } from "../shared/types";

const logger = createLogger("scorer");

export interface ScorerResult {
  projects: ScoredProject[];
  stats: { ship: number; watch: number; skip: number; avgScore: number };
  durationMs: number;
}

export async function score(projects: EnrichedProject[]): Promise<ScorerResult> {
  const start = Date.now();
  const config = getConfig();
  const scored: ScoredProject[] = [];

  logger.info(`Phase 3: Scoring ${projects.length} projects`);

  // Pass 1: compute all factors and raw score
  for (const project of projects) {
    const hasToken = !!project.resolution.contractAddress;
    let category = project.category as string;

    // Determine scoring profile
    const profileKey =
      category === "meme"
        ? "meme"
        : hasToken
        ? `${category}_token`
        : `${category}_notoken`;

    const weights = getWeights(profileKey);
    const factors = computeFactors(project);

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      const factorScore = factors[factor] ?? 0;
      weightedSum += factorScore * weight;
      totalWeight += weight;
    }
    const rawScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const verdict = determineVerdict(rawScore, config);
    const whaleSignal = detectWhaleSignal(project);

    const factorArray = Object.entries(factors).map(([key, value]) => ({
      key,
      label: key,
      value,
      weight: weights[key] ?? 0,
      weighted: ((weights[key] ?? 0) / 100) * value,
    }));

    const scoring: ScoreResult = {
      score: rawScore,
      grade: scoreToGrade(rawScore),
      profile: profileKey,
      factors: factorArray,
      composite: {
        survival: Math.round((factors["contractTrust"]! + factors["ecosystemRank"]!) / 2),
        momentum: Math.round(
          ((factors["priceMomentum"] ?? 50) + (factors["tradingHealth"] ?? 50)) / 2
        ),
        community: Math.round(
          ((factors["holderStrength"] ?? 50) + (factors["twitterActivity"]!)) / 2
        ),
        fundamentals: Math.round(
          ((factors["tvlHealth"]! + factors["marketCap"]!) / 2)
        ),
      },
      scoredAt: new Date(),
    };

    scored.push({
      ...project,
      scoring,
      verdict,
    });
  }

  // Pass 2: categoryHealth — replace placeholder 50 with median of same category
  const byCat = new Map<string, number[]>();
  for (const p of scored) {
    const key = p.category;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(p.scoring.score);
  }

  for (const p of scored) {
    const scores = byCat.get(p.category) ?? [];
    const median = calcMedian(scores);
    const catFactor = p.scoring.factors.find((f) => f.key === "categoryHealth");
    if (catFactor) catFactor.value = median;
  }

  // Final stats
  const stats = scored.reduce(
    (acc, p) => {
      if (p.verdict === "SHIP") acc.ship++;
      else if (p.verdict === "WATCH") acc.watch++;
      else acc.skip++;
      acc.avgScore += p.scoring.score;
      return acc;
    },
    { ship: 0, watch: 0, skip: 0, avgScore: 0 }
  );
  stats.avgScore = scored.length > 0 ? Math.round(stats.avgScore / scored.length) : 0;

  logger.info(
    `Phase 3 complete: SHIP=${stats.ship} WATCH=${stats.watch} SKIP=${stats.skip} avg=${stats.avgScore}`
  );

  return { projects: scored, stats, durationMs: Date.now() - start };
}

function determineVerdict(
  score: number,
  config: ReturnType<typeof getConfig>
): Verdict {
  if (score >= config.SCORE_SHIP_THRESHOLD) return "SHIP";
  if (score >= config.SCORE_WATCH_THRESHOLD) return "WATCH";
  return "SKIP";
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function calcMedian(arr: number[]): number {
  if (arr.length === 0) return 50;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
    : (sorted[mid] ?? 50);
}
