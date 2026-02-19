// =============================================================================
// Ecosystem Intelligence — Death Pattern & Category Survival Stats
// =============================================================================
// Aggregates post-mortem data from VPS pipeline API into actionable ecosystem-wide
// stats. This is data that CANNOT be replicated by chatting with an AI chatbot
// because it's derived from our curated, scored BNB project dataset.
//
// Data source priority:
//   1. VPS pipeline API (live, refreshed every CACHE_TTL_MS)
//   2. local data/projects.json (sync fallback when API is unavailable)

import { getProjects, getProjectsFromFile } from "@/lib/data";
import type { Category, ProjectData } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategorySurvival {
  category: Category;
  alive: number;
  zombie: number;
  dead: number;
  total: number;
  survivalRate: number;
}

export interface DeathPatternStat {
  pattern: string;
  count: number;
  percentage: number;
}

export interface EcosystemIntelligence {
  totalProjects: number;
  totalAlive: number;
  totalZombie: number;
  totalDead: number;
  overallSurvivalRate: number;
  categorySurvival: CategorySurvival[];
  topDeathPatterns: DeathPatternStat[];
  totalWithPostMortem: number;
}

// ---------------------------------------------------------------------------
// Cache (TTL-based: refreshed every 10 minutes from live API)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const globalForEcosystem = globalThis as unknown as {
  __ecosystemIntel?: EcosystemIntelligence;
  __ecosystemIntelAt?: number;
  __ecosystemIntelPromise?: Promise<EcosystemIntelligence>;
};

/**
 * Async version — fetches live data from VPS API, with TTL cache.
 * Used by validate/route.ts for up-to-date Grok prompts.
 */
export async function getEcosystemIntelligence(): Promise<EcosystemIntelligence> {
  const now = Date.now();
  const cached = globalForEcosystem.__ecosystemIntel;
  const cachedAt = globalForEcosystem.__ecosystemIntelAt ?? 0;

  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  // Deduplicate concurrent requests — return in-flight promise if exists
  if (globalForEcosystem.__ecosystemIntelPromise) {
    return globalForEcosystem.__ecosystemIntelPromise;
  }

  const promise = (async () => {
    try {
      const projects = await getProjects();
      const intel = computeEcosystemIntelligence(projects);
      globalForEcosystem.__ecosystemIntel = intel;
      globalForEcosystem.__ecosystemIntelAt = Date.now();
      return intel;
    } catch {
      // Fallback to sync file read if API unavailable
      const projects = getProjectsFromFile();
      const intel = computeEcosystemIntelligence(projects);
      globalForEcosystem.__ecosystemIntel = intel;
      globalForEcosystem.__ecosystemIntelAt = Date.now();
      return intel;
    } finally {
      globalForEcosystem.__ecosystemIntelPromise = undefined;
    }
  })();

  globalForEcosystem.__ecosystemIntelPromise = promise;
  return promise;
}

/**
 * Sync version — used only by internal ecosystem-stats helpers that cannot be async.
 * Falls back to cached value or file read.
 */
function getEcosystemIntelligenceSync(): EcosystemIntelligence {
  if (globalForEcosystem.__ecosystemIntel) {
    return globalForEcosystem.__ecosystemIntel;
  }
  const projects = getProjectsFromFile();
  const intel = computeEcosystemIntelligence(projects);
  globalForEcosystem.__ecosystemIntel = intel;
  globalForEcosystem.__ecosystemIntelAt = Date.now();
  return intel;
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

function computeEcosystemIntelligence(projects: ProjectData[]): EcosystemIntelligence {
  const alive = projects.filter((p) => p.status === "alive");
  const zombie = projects.filter((p) => p.status === "zombie");
  const dead = projects.filter((p) => p.status === "dead");

  // Category breakdown
  const catMap = new Map<Category, { alive: number; zombie: number; dead: number }>();
  for (const p of projects) {
    const cat = p.category;
    const entry = catMap.get(cat) ?? { alive: 0, zombie: 0, dead: 0 };
    entry[p.status as "alive" | "zombie" | "dead"]++;
    catMap.set(cat, entry);
  }

  const categorySurvival: CategorySurvival[] = Array.from(catMap.entries())
    .map(([category, counts]) => {
      const total = counts.alive + counts.zombie + counts.dead;
      return {
        category,
        ...counts,
        total,
        survivalRate: total > 0 ? Math.round((counts.alive / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.survivalRate - a.survivalRate);

  // Death patterns
  const patternCounts = new Map<string, number>();
  const deadAndZombie = [...dead, ...zombie];

  for (const p of deadAndZombie) {
    if (p.postMortem?.deathPattern) {
      const pattern = p.postMortem.deathPattern;
      patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
    }
  }

  const totalWithPostMortem = Array.from(patternCounts.values()).reduce((s, c) => s + c, 0);
  const topDeathPatterns: DeathPatternStat[] = Array.from(patternCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pattern, count]) => ({
      pattern,
      count,
      percentage: totalWithPostMortem > 0 ? Math.round((count / totalWithPostMortem) * 100) : 0,
    }));

  return {
    totalProjects: projects.length,
    totalAlive: alive.length,
    totalZombie: zombie.length,
    totalDead: dead.length,
    overallSurvivalRate: projects.length > 0 ? Math.round((alive.length / projects.length) * 100) : 0,
    categorySurvival,
    topDeathPatterns,
    totalWithPostMortem,
  };
}

// ---------------------------------------------------------------------------
// Helpers for prompt & UI usage
// ---------------------------------------------------------------------------

/** Get survival stats for a specific category (used in validation prompt) */
export async function getCategorySurvivalText(category: Category): Promise<string> {
  const intel = await getEcosystemIntelligence();
  const cat = intel.categorySurvival.find((c) => c.category === category);

  if (!cat) return `No ecosystem data for ${category}.`;

  return `${category}: ${cat.survivalRate}% survival rate (${cat.alive} alive, ${cat.zombie} zombie, ${cat.dead} dead out of ${cat.total} projects)`;
}

/** Get top death patterns as formatted text for prompts */
export async function getDeathPatternsText(): Promise<string> {
  const intel = await getEcosystemIntelligence();

  if (intel.topDeathPatterns.length === 0) return "No death pattern data available.";

  return intel.topDeathPatterns
    .map((dp) => `- ${dp.pattern} (${dp.percentage}% of failures)`)
    .join("\n");
}

/** Get ecosystem summary for validation context */
export async function getEcosystemSummaryForPrompt(primaryCategory: Category): Promise<string> {
  const intel = await getEcosystemIntelligence();
  const catSurvival = await getCategorySurvivalText(primaryCategory);

  return `## Ecosystem-wide Intelligence (${intel.totalProjects} BNB projects analyzed)
- Overall survival rate: ${intel.overallSurvivalRate}% (${intel.totalAlive} alive / ${intel.totalZombie} zombie / ${intel.totalDead} dead)
- ${catSurvival}
- Top failure patterns: ${intel.topDeathPatterns.map((dp) => `${dp.pattern} (${dp.percentage}%)`).join(", ")}`;
}

/** Sync versions — used by components that can't be async (returns cached/fallback data) */
export function getCategorySurvivalTextSync(category: Category): string {
  const intel = getEcosystemIntelligenceSync();
  const cat = intel.categorySurvival.find((c) => c.category === category);
  if (!cat) return `No ecosystem data for ${category}.`;
  return `${category}: ${cat.survivalRate}% survival rate (${cat.alive} alive, ${cat.zombie} zombie, ${cat.dead} dead out of ${cat.total} projects)`;
}

export function getEcosystemSummaryForPromptSync(primaryCategory: Category): string {
  const intel = getEcosystemIntelligenceSync();
  const catSurvival = getCategorySurvivalTextSync(primaryCategory);
  return `## Ecosystem-wide Intelligence (${intel.totalProjects} BNB projects analyzed)
- Overall survival rate: ${intel.overallSurvivalRate}% (${intel.totalAlive} alive / ${intel.totalZombie} zombie / ${intel.totalDead} dead)
- ${catSurvival}
- Top failure patterns: ${intel.topDeathPatterns.map((dp) => `${dp.pattern} (${dp.percentage}%)`).join(", ")}`;
}
