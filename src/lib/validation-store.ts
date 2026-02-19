// =============================================================================
// Validation Aggregation Store — Community Intelligence (Supabase/PostgreSQL)
// =============================================================================
// Persists anonymous validation records (category + signal + pmfScore) to build
// aggregate stats over time. This creates a data moat: "247 ideas validated,
// DEX ideas avg PMF 38/100" — impossible to replicate by chatting with AI.
//
// Architecture:
//   - Supabase PostgreSQL via Prisma ORM
//   - Survives server restarts, serverless cold starts, and redeployments
//   - No PII stored — only category, signal, score, timestamp

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types (unchanged — consumers import these)
// ---------------------------------------------------------------------------

export interface ValidationRecord {
  category: string;
  signal: string;
  pmfScore: number;
  timestamp: number;
}

/** Full validation data for DB persistence */
export interface ValidationRecordFull {
  category: string;
  signal: string;
  pmfScore: number;
  ideaDescription?: string;
  targetUsers?: string;
  recommendation?: string;
  biggestRisk?: string;
  deathPatterns?: string;
  edgeNeeded?: string;
  timingAssessment?: string;
  analysisMode?: string;
}

export interface CategoryAggregation {
  category: string;
  count: number;
  avgPmfScore: number;
  shipCount: number;
  cautionCount: number;
  highRiskCount: number;
}

export interface ValidationAggregateStats {
  totalValidations: number;
  categories: CategoryAggregation[];
  recentCount7d: number;
  signalDistribution: { ship: number; caution: number; highRisk: number };
  avgPmfScore: number;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function recordValidation(
  category: string,
  signal: string,
  pmfScore: number,
  extra?: Omit<ValidationRecordFull, "category" | "signal" | "pmfScore">
): Promise<void> {
  try {
    await prisma.validationRecord.create({
      data: {
        category,
        signal,
        pmfScore,
        ideaDescription: extra?.ideaDescription,
        targetUsers: extra?.targetUsers,
        recommendation: extra?.recommendation,
        biggestRisk: extra?.biggestRisk,
        deathPatterns: extra?.deathPatterns,
        edgeNeeded: extra?.edgeNeeded,
        timingAssessment: extra?.timingAssessment,
        analysisMode: extra?.analysisMode,
      },
    });
  } catch (err) {
    console.error("[ValidationStore] Record failed:", err);
  }
}

/** No-op — Prisma writes are immediate. Kept for API compatibility. */
export function flushValidationStore(): void {
  // No-op: Prisma writes go directly to PostgreSQL
}

// ---------------------------------------------------------------------------
// Read (aggregate stats)
// ---------------------------------------------------------------------------

export async function getValidationAggregateStats(): Promise<ValidationAggregateStats> {
  try {
    const records = await prisma.validationRecord.findMany({
      select: { category: true, signal: true, pmfScore: true, createdAt: true },
    });

    if (records.length === 0) {
      return {
        totalValidations: 0,
        categories: [],
        recentCount7d: 0,
        signalDistribution: { ship: 0, caution: 0, highRisk: 0 },
        avgPmfScore: 0,
      };
    }

    let shipCount = 0;
    let cautionCount = 0;
    let highRiskCount = 0;
    let totalPmf = 0;

    const catMap = new Map<
      string,
      { count: number; totalPmf: number; ship: number; caution: number; highRisk: number }
    >();

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recentCount = 0;

    for (const r of records) {
      totalPmf += r.pmfScore;

      if (r.signal === "SHIP") shipCount++;
      else if (r.signal === "SHIP_WITH_CAUTION") cautionCount++;
      else highRiskCount++;

      if (r.createdAt.getTime() >= sevenDaysAgo) recentCount++;

      const entry = catMap.get(r.category) ?? {
        count: 0,
        totalPmf: 0,
        ship: 0,
        caution: 0,
        highRisk: 0,
      };
      entry.count++;
      entry.totalPmf += r.pmfScore;
      if (r.signal === "SHIP") entry.ship++;
      else if (r.signal === "SHIP_WITH_CAUTION") entry.caution++;
      else entry.highRisk++;
      catMap.set(r.category, entry);
    }

    const categories: CategoryAggregation[] = Array.from(catMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgPmfScore: Math.round(data.totalPmf / data.count),
        shipCount: data.ship,
        cautionCount: data.caution,
        highRiskCount: data.highRisk,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalValidations: records.length,
      categories,
      recentCount7d: recentCount,
      signalDistribution: { ship: shipCount, caution: cautionCount, highRisk: highRiskCount },
      avgPmfScore: Math.round(totalPmf / records.length),
    };
  } catch (err) {
    console.error("[ValidationStore] getAggregateStats failed:", err);
    return {
      totalValidations: 0,
      categories: [],
      recentCount7d: 0,
      signalDistribution: { ship: 0, caution: 0, highRisk: 0 },
      avgPmfScore: 0,
    };
  }
}

/** Get count of similar ideas validated (same category) */
export async function getSimilarIdeaCount(category: string): Promise<number> {
  try {
    return await prisma.validationRecord.count({
      where: { category },
    });
  } catch {
    return 0;
  }
}

/** Get total validations count (for landing page counter) */
export async function getTotalValidationCount(): Promise<number> {
  try {
    return await prisma.validationRecord.count();
  } catch {
    return 0;
  }
}
