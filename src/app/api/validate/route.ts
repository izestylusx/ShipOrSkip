import { NextRequest, NextResponse } from "next/server";
import { getProjects } from "@/lib/data";
import type { Category, ProjectData } from "@/types";
import { getProjectCategories } from "@/lib/project-categories";
import {
  expandCategoryAlias,
  normalizeCategoryLabel,
  normalizeCategoryList,
  resolveValidationCategories,
  type CategoryResolution,
  type ResolvedCategoryWeight,
} from "@/lib/category-inference";
import {
  getValidationIntel,
  getValidationVerdict,
  isGrokEnabled,
  type GrokValidationIntel,
} from "@/lib/grok-api";
import {
  getRedditCommunityIntel,
  isKimiEnabled,
  type RedditCommunityIntel,
} from "@/lib/kimi-api";
import {
  createJob,
  getJob,
  completeJob,
  failJob,
  updateJobStep,
  type SimilarMatch,
  type ValidationJobResult,
} from "@/lib/validation-jobs";
import {
  getEcosystemIntelligence,
  getEcosystemSummaryForPrompt,
} from "@/lib/ecosystem-stats";
import {
  recordValidation,
  flushValidationStore,
  getValidationAggregateStats,
  getSimilarIdeaCount,
} from "@/lib/validation-store";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GROK_ENABLED = isGrokEnabled();
const KIMI_ENABLED = isKimiEnabled();
const MAX_SIMILAR = 5;
// MAX_GROK_HANDLES kept for future batch Twitter expansion
// const MAX_GROK_HANDLES = 5;

const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = rateLimitMap.get(ip) ?? [];
  const recent = hits.filter((timestamp) => now - timestamp < RATE_WINDOW);
  if (recent.length >= RATE_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // not configured — skip verification

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: ip }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Fail closed: if Cloudflare is unreachable, block the request
    return false;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidateRequestBody {
  description?: unknown;
  category?: unknown;
  categories?: unknown;
  targetUsers?: unknown;
  privateMode?: unknown;
  cfTurnstileToken?: unknown;
}

type CategorySector = "defi" | "gaming" | "meme" | "infrastructure" | "stablecoin";

type FallbackReason =
  | "missing_grok_key"
  | "grok_timeout"
  | "grok_error"
  | "grok_unparseable_json";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEcosystemStats(projects: ProjectData[]) {
  return {
    totalProjects: projects.length,
    alive: projects.filter((project) => project.status === "alive").length,
    zombie: projects.filter((project) => project.status === "zombie").length,
    dead: projects.filter((project) => project.status === "dead").length,
  };
}

function getSectorForCategory(category: Category): CategorySector {
  if (
    category === "DEX" ||
    category === "Lending" ||
    category === "Yield" ||
    category === "Bridge" ||
    category === "Launchpad"
  ) {
    return "defi";
  }

  if (category === "Gaming" || category === "NFT") return "gaming";
  if (category === "Meme") return "meme";
  if (category === "Stablecoin") return "stablecoin";
  return "infrastructure";
}

function getSectorForProjectType(categoryType: ProjectData["categoryType"]): CategorySector {
  if (categoryType.startsWith("defi")) return "defi";
  if (categoryType.startsWith("gaming")) return "gaming";
  if (categoryType.startsWith("meme")) return "meme";
  if (categoryType.startsWith("infra")) return "infrastructure";
  return "defi";
}

function parseSelectedCategories(body: ValidateRequestBody): Category[] {
  const byArray = normalizeCategoryList(body.categories);

  const bySingle: Category[] = [];
  if (typeof body.category === "string") {
    bySingle.push(...expandCategoryAlias(body.category));
    if (bySingle.length === 0) {
      const normalized = normalizeCategoryLabel(body.category);
      if (normalized) bySingle.push(normalized);
    }
  }

  return Array.from(new Set([...byArray, ...bySingle]));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toCategoryContextPayload(categoryContext: CategoryResolution) {
  return {
    source: categoryContext.source,
    primaryCategory: categoryContext.primaryCategory,
    categories: categoryContext.categories.map((item) => ({
      category: item.category,
      weight: round(item.weight),
      confidence: round(item.confidence),
    })),
    inferredCategories: categoryContext.inferred.map((item) => ({
      category: item.category,
      confidence: round(item.confidence),
      matchedSignals: item.matchedSignals,
    })),
  };
}

function toSimilarProjectsPayload(similar: SimilarMatch[]) {
  return similar.map((match) => ({
    name: match.project.name,
    slug: match.project.slug,
    score: match.project.survivalScore,
    status: match.project.status,
    category: match.project.category,
    marketCap: match.project.token?.marketCap ?? null,
    matchReasons: match.matchReasons,
  }));
}

function toTrendSummaryPayload(grokIntel: GrokValidationIntel | null) {
  const trend = grokIntel?.trendAnalysis;
  if (!trend) return undefined;

  return {
    categoryTrend: trend.categoryTrend,
    trendScore: trend.trendScore,
    buzzLevel: trend.twitterBuzzLevel,
    narrative: trend.narrativeSummary,
    risingKeywords: trend.risingKeywords,
    decliningKeywords: trend.decliningKeywords,
    timingVerdict: trend.timingVerdict,
    topicTweets: trend.topicTweets.map((t) => ({
      author: t.author,
      text: t.text,
      context: t.context,
    })),
  };
}

// ---------------------------------------------------------------------------
// Similar project matching (multi-category weighted)
// ---------------------------------------------------------------------------

function findSimilarProjects(
  description: string,
  categoryWeights: ResolvedCategoryWeight[],
  allProjects: ProjectData[]
): SimilarMatch[] {
  const descLower = description.toLowerCase();
  const categoryWeightMap = new Map<Category, number>();
  const sectorWeightMap = new Map<CategorySector, number>();

  for (const entry of categoryWeights) {
    categoryWeightMap.set(entry.category, entry.weight);
    const sector = getSectorForCategory(entry.category);
    sectorWeightMap.set(sector, (sectorWeightMap.get(sector) ?? 0) + entry.weight);
  }

  const keywords = [
    "swap", "exchange", "trade", "lend", "borrow", "farm", "stake", "bridge",
    "nft", "game", "play", "earn", "meme", "token", "launch", "yield", "vault",
    "amm", "liquidity", "pool", "aggregator", "cross-chain", "wallet", "ai",
    "oracle", "rwa", "social",
  ];

  const scored: SimilarMatch[] = allProjects.map((project) => {
    let relevance = 0;
    let keywordScore = 0;
    const matchReasons: string[] = [];

    const projectCategories = getProjectCategories(project);
    const overlapCategories = projectCategories.filter((projectCategory) =>
      categoryWeightMap.has(projectCategory)
    );

    if (overlapCategories.length > 0) {
      const overlapWeight = overlapCategories.reduce(
        (sum, category) => sum + (categoryWeightMap.get(category) ?? 0),
        0
      );
      relevance += Math.round(18 + overlapWeight * 27);

      const overlapDetails = overlapCategories.map(
        (category) => `${category} (${Math.round((categoryWeightMap.get(category) ?? 0) * 100)}%)`
      );
      matchReasons.push(`Category overlap: ${overlapDetails.join(", ")}`);
    }

    if (overlapCategories.length === 0) {
      const projectSector = getSectorForProjectType(project.categoryType);
      const sectorWeight = sectorWeightMap.get(projectSector) ?? 0;
      const stablecoinToDefiWeight =
        projectSector === "defi" ? (sectorWeightMap.get("stablecoin") ?? 0) * 0.7 : 0;
      const effectiveSectorWeight = Math.min(1, sectorWeight + stablecoinToDefiWeight);

      if (effectiveSectorWeight > 0) {
        relevance += Math.round(8 + effectiveSectorWeight * 16);
        matchReasons.push(`Sector overlap: ${projectSector}`);
      }
    }

    const projectName = project.name.toLowerCase();
    const categoryText = (projectCategories as string[]).join(" ").toLowerCase();

    for (const keyword of keywords) {
      if (
        descLower.includes(keyword) &&
        (projectName.includes(keyword) || categoryText.includes(keyword))
      ) {
        relevance += 8;
        keywordScore += 8;
        matchReasons.push(`Keyword match: \"${keyword}\"`);
        if (keywordScore >= 24) break;
      }
    }

    if (project.postMortem) {
      relevance += 5;
      matchReasons.push("Has death analysis");
    }

    if (project.aliveSummary) {
      relevance += 5;
      matchReasons.push("Has survival analysis");
    }

    if (!project.token?.marketCap && !project.tvl?.current) {
      relevance -= 5;
    }

    return {
      project,
      relevance: Math.max(0, Math.min(100, relevance)),
      matchReasons,
    };
  });

  return scored
    .filter((item) => item.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, MAX_SIMILAR);
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

async function buildPrompt(
  description: string,
  categoryContext: CategoryResolution,
  targetUsers: string,
  similar: SimilarMatch[],
  grokIntel: GrokValidationIntel | null,
  redditIntel: RedditCommunityIntel | null = null
): Promise<string> {
  const aliveCount = similar.filter((item) => item.project.status === "alive").length;
  const deadCount = similar.filter((item) => item.project.status === "dead").length;
  const zombieCount = similar.filter((item) => item.project.status === "zombie").length;

  const categoryScope = categoryContext.categories
    .map((item) => `${item.category} (${Math.round(item.weight * 100)}%)`)
    .join(", ");

  const categorySourceText =
    categoryContext.source === "auto_inferred"
      ? "Auto-inferred from builder description"
      : "Builder-selected (manual override)";

  const inferredHint =
    categoryContext.source === "user_selected" && categoryContext.inferred.length > 0
      ? `\n- AI-inferred categories (for context): ${categoryContext.inferred
        .map((item) => `${item.category} (${Math.round(item.confidence * 100)}%)`)
        .join(", ")}\n  NOTE: The builder manually selected a narrower scope for comparable matching, but the idea may span the inferred categories above. Analyze the idea as described, not just the selected category.`
      : "";

  const projectContext = similar
    .map((item) => {
      const project = item.project;
      let context = `- ${project.name} [${project.status.toUpperCase()}] score=${project.survivalScore}/100\n`;
      context += `  Category: ${project.category} | Relevance: ${item.relevance}/100\n`;

      if (project.token?.marketCap) {
        context += `  Market cap: $${(project.token.marketCap / 1e6).toFixed(1)}M\n`;
      }

      if (project.postMortem) {
        context += `  Death pattern: ${project.postMortem.deathPattern}\n`;
        context += `  Root cause: ${project.postMortem.rootCause}\n`;
      }

      if (project.aliveSummary) {
        context += `  Why survives: ${project.aliveSummary.whyItSurvives}\n`;
        context += `  Differentiator: ${project.aliveSummary.keyDifferentiator}\n`;
      }

      return context;
    })
    .join("\n");

  const trendSection = grokIntel?.trendAnalysis
    ? `\n## Twitter/Social Trend Snapshot (LIVE DATA)\n- Category trend: ${grokIntel.trendAnalysis.categoryTrend} (${grokIntel.trendAnalysis.trendScore}/100)\n- Buzz level: ${grokIntel.trendAnalysis.twitterBuzzLevel}\n- Narrative: ${grokIntel.trendAnalysis.narrativeSummary}\n- Rising keywords: ${grokIntel.trendAnalysis.risingKeywords.join(", ") || "none"}\n- Declining keywords: ${grokIntel.trendAnalysis.decliningKeywords.join(", ") || "none"}\n- Timing verdict: ${grokIntel.trendAnalysis.timingVerdict}`
    : "";

  const redditSection = redditIntel
    ? `\n## Reddit Community Intelligence (LIVE DATA)\n- Community buzz: ${redditIntel.communityBuzz}\n- Sentiment: ${redditIntel.sentimentBreakdown.positive}% positive, ${redditIntel.sentimentBreakdown.negative}% negative, ${redditIntel.sentimentBreakdown.neutral}% neutral\n- Key insights: ${redditIntel.keyInsights.join(" | ") || "none"}${redditIntel.relevantThreads.length > 0 ? "\n- Relevant threads:\n" + redditIntel.relevantThreads.slice(0, 3).map((t) => `  - [${t.subreddit}] ${t.title} (${t.sentiment}): ${t.summary}`).join("\n") : ""}`
    : "";

  const ecosystemSummary = await getEcosystemSummaryForPrompt(categoryContext.primaryCategory);
  const communityStats = await getValidationAggregateStats();
  const similarIdeaCount = await getSimilarIdeaCount(categoryContext.primaryCategory);

  const communitySection = communityStats.totalValidations > 0
    ? `\n## Community Intelligence (${communityStats.totalValidations} ideas validated on this platform)\n- ${similarIdeaCount} builders previously explored ${categoryContext.primaryCategory} ideas\n- Average PMF score across all validations: ${communityStats.avgPmfScore}/100\n- Signal distribution: ${communityStats.signalDistribution.ship} SHIP, ${communityStats.signalDistribution.caution} CAUTION, ${communityStats.signalDistribution.highRisk} HIGH_RISK`
    : "";

  return `You are ShipOrSkip AI, a BNB Chain ecosystem intelligence analyst.

## CRITICAL: Analyze the IDEA, not just the category
The builder's description below is the PRIMARY input. The category scope is used to find
comparable projects, but your verdict must be about the SPECIFIC idea described - its
unique value proposition, its specific risks, and what it specifically needs to succeed.
Do NOT simply analyze the broad category. Focus on what makes THIS idea different.

${ecosystemSummary}
${communitySection}

## Builder Idea
- Description: ${description}
- Primary category (for comparables): ${categoryContext.primaryCategory}
- Category scope: ${categoryScope}
- Category source: ${categorySourceText}${inferredHint}
- Target users: ${targetUsers || "Not specified"}

## Similar/Comparable Projects (${similar.length})
These projects share category overlap and serve as reference points - but the builder's
idea may differ significantly from these. Assess how the idea relates to them, not as if
it IS one of them.
Status breakdown: ${aliveCount} alive, ${zombieCount} zombie, ${deadCount} dead

${projectContext || "No similar projects in dataset."}
${trendSection}
${redditSection}

## Task
Give an honest data-backed verdict about the SPECIFIC idea described above.
Return strict JSON only with these field definitions:
{
  "signal": "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION",
  "pmfScore": <0-100 - product-market fit likelihood for THIS specific idea>,
  "deathPatterns": "<common death patterns from comparable projects that could affect THIS idea>",
  "biggestRisk": "<the single biggest risk for THIS SPECIFIC idea - not just generic category competition>",
  "recommendation": "<actionable advice for THIS specific idea>",
  "edgeNeeded": "<what additional differentiation the builder needs BEYOND what they already described - do NOT restate the idea's own core features as the edge needed>",
  "timingAssessment": "<is the timing right for THIS type of product?>",
  "trendInsight": "<relevant trend context for THIS idea>"
}

Use the project evidence above and reference concrete patterns.
Remember: biggestRisk and edgeNeeded must be about the SPECIFIC idea, not generic category analysis.`;
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

const FALLBACK_RECOMMENDATION_BY_REASON: Record<FallbackReason, string> = {
  missing_grok_key: "Enable XAI_API_KEY to get full AI-generated analysis.",
  grok_timeout:
    "Grok reasoning timed out. Showing data-driven fallback from ecosystem and social signals.",
  grok_error:
    "Grok reasoning failed for this request. Showing data-driven fallback from ecosystem and social signals.",
  grok_unparseable_json:
    "Grok response JSON was invalid. Showing data-driven fallback from ecosystem and social signals.",
};

function buildFallbackResult(
  similar: SimilarMatch[],
  grokIntel: GrokValidationIntel | null,
  ecosystemStats: ReturnType<typeof getEcosystemStats>,
  categoryContext: CategoryResolution,
  reason: FallbackReason = "grok_error"
): ValidationJobResult {
  const alive = similar.filter((item) => item.project.status === "alive");
  const dead = similar.filter((item) => item.project.status === "dead");
  const zombie = similar.filter((item) => item.project.status === "zombie");

  let pmfScore = 50;
  if (similar.length > 0) {
    const survivalRate = alive.length / similar.length;
    pmfScore = Math.round(30 + survivalRate * 50);
  }

  if (grokIntel?.trendAnalysis?.categoryTrend === "rising") {
    pmfScore = Math.min(100, pmfScore + 10);
  }
  if (grokIntel?.trendAnalysis?.categoryTrend === "declining") {
    pmfScore = Math.max(0, pmfScore - 10);
  }

  let signal: "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION" = "SHIP_WITH_CAUTION";
  if (pmfScore >= 70 && dead.length === 0) signal = "SHIP";
  if (pmfScore < 40 || dead.length > alive.length) signal = "HIGH_RISK";

  const deathPatterns = dead
    .map((item) => item.project.postMortem?.deathPattern ?? `${item.project.name} has no post-mortem`)
    .join("; ");

  const risks: string[] = [];
  if (dead.length > alive.length) {
    risks.push("More dead than alive comparable projects in this category scope");
  }
  if (zombie.length > 0) {
    risks.push(`${zombie.length} zombie projects suggest weak retention in this segment`);
  }

  return {
    signal,
    pmfScore,
    similarProjects: toSimilarProjectsPayload(similar),
    trendAnalysis: toTrendSummaryPayload(grokIntel),
    categoryContext: toCategoryContextPayload(categoryContext),
    deathPatterns: deathPatterns || "No death patterns found for this category scope",
    biggestRisk: risks[0] ?? "Limited comparable data in this category scope",
    recommendation: FALLBACK_RECOMMENDATION_BY_REASON[reason],
    edgeNeeded: "Pending AI analysis",
    timingAssessment: grokIntel?.trendAnalysis?.timingVerdict ?? "Pending AI analysis",
    trendInsight: grokIntel?.trendAnalysis?.narrativeSummary ?? "Pending AI analysis",
    analysisMode: "fallback",
    fallbackReason: reason,
    ecosystemStats,
  };
}

// ---------------------------------------------------------------------------
// Background job processing
// ---------------------------------------------------------------------------

async function processValidationJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;

  const { input } = job;

  try {
    // Step 1: Grok x_search (Twitter intel) + Kimi $web_search (Reddit intel) — parallel
    updateJobStep(jobId, "intel");
    let grokIntel: GrokValidationIntel | null = null;
    let redditIntel: RedditCommunityIntel | null = null;

    [grokIntel, redditIntel] = await Promise.all([
      GROK_ENABLED
        ? getValidationIntel(input.description, input.trendCategory).catch((err) => {
            console.warn("[Validate] Grok intel failed:", err);
            return null;
          })
        : Promise.resolve(null),
      KIMI_ENABLED
        ? getRedditCommunityIntel(input.description).catch((err) => {
            console.warn("[Validate] Kimi Reddit intel failed:", err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Step 1b: reddit_intel (visual step acknowledgment)
    updateJobStep(jobId, "reddit_intel");

    // Step 2: Verdict — Grok primary (fast-reasoning)
    updateJobStep(jobId, "verdict");

    if (!GROK_ENABLED) {
      const fallback = buildFallbackResult(
        input.similar,
        grokIntel,
        input.ecosystemStats,
        input.categoryContext,
        "missing_grok_key"
      );
      completeJob(jobId, fallback);
      if (!input.privateMode) {
        await recordValidation(input.categoryContext.primaryCategory, fallback.signal, fallback.pmfScore, {
          ideaDescription: input.description,
          targetUsers: input.targetUsers,
          recommendation: fallback.recommendation,
          biggestRisk: fallback.biggestRisk,
          deathPatterns: fallback.deathPatterns,
          edgeNeeded: fallback.edgeNeeded,
          timingAssessment: fallback.timingAssessment,
          analysisMode: "fallback",
        });
      }
      return;
    }

    const prompt = await buildPrompt(
      input.description,
      input.categoryContext,
      input.targetUsers,
      input.similar,
      grokIntel,
      redditIntel
    );

    // Grok is the primary verdict model (grok-4-1-fast-reasoning)
    let verdict = null;
    const verdictAnalysisMode: "ai" | "ai_grok_fallback" = "ai";

    const { verdict: grokVerdict, error: grokVerdictError } = await getValidationVerdict(prompt);
    if (grokVerdict) {
      verdict = grokVerdict;
      console.log("[Grok] Verdict complete (primary)");
    } else {
      const errorMessage = grokVerdictError ?? "unknown error";
      let reason: FallbackReason = "grok_error";
      if (/timed out|timeout/i.test(errorMessage)) reason = "grok_timeout";
      if (/unparseable/i.test(errorMessage)) reason = "grok_unparseable_json";

      const fallbackResult = buildFallbackResult(
        input.similar,
        grokIntel,
        input.ecosystemStats,
        input.categoryContext,
        reason
      );
      completeJob(jobId, fallbackResult);
      if (!input.privateMode) {
        await recordValidation(input.categoryContext.primaryCategory, fallbackResult.signal, fallbackResult.pmfScore, {
          ideaDescription: input.description,
          targetUsers: input.targetUsers,
          recommendation: fallbackResult.recommendation,
          biggestRisk: fallbackResult.biggestRisk,
          deathPatterns: fallbackResult.deathPatterns,
          edgeNeeded: fallbackResult.edgeNeeded,
          timingAssessment: fallbackResult.timingAssessment,
          analysisMode: "fallback",
        });
      }
      return;
    }

    // Success: full AI analysis
    const aiResult: ValidationJobResult = {
      signal: verdict.signal,
      pmfScore: verdict.pmfScore,
      similarProjects: toSimilarProjectsPayload(input.similar),
      trendAnalysis: toTrendSummaryPayload(grokIntel),
      categoryContext: toCategoryContextPayload(input.categoryContext),
      deathPatterns: verdict.deathPatterns,
      biggestRisk: verdict.biggestRisk,
      recommendation: verdict.recommendation,
      edgeNeeded: verdict.edgeNeeded,
      timingAssessment: verdict.timingAssessment,
      trendInsight: verdict.trendInsight,
      analysisMode: verdictAnalysisMode,
      redditIntel: redditIntel ?? undefined,
      ecosystemStats: input.ecosystemStats,
    };
    completeJob(jobId, aiResult);

    // Record for community intelligence aggregation (skip for private/premium)
    if (!input.privateMode) {
      await recordValidation(
        input.categoryContext.primaryCategory,
        verdict.signal,
        verdict.pmfScore,
        {
          ideaDescription: input.description,
          targetUsers: input.targetUsers,
          recommendation: verdict.recommendation,
          biggestRisk: verdict.biggestRisk,
          deathPatterns: verdict.deathPatterns,
          edgeNeeded: verdict.edgeNeeded,
          timingAssessment: verdict.timingAssessment,
          analysisMode: "ai",
        }
      );
    }
    flushValidationStore();
  } catch (error) {
    console.error("[Validate] Job processing error:", error);
    failJob(jobId, (error as Error).message ?? "Unknown processing error");
  }
}

// ---------------------------------------------------------------------------
// Route handler: POST /api/validate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limited. Max 5 validations per 10 minutes." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as ValidateRequestBody;

    // Verify CAPTCHA before any expensive AI operations
    if (process.env.TURNSTILE_SECRET_KEY) {
      const token = typeof body.cfTurnstileToken === "string" ? body.cfTurnstileToken : "";
      const captchaOk = token ? await verifyTurnstile(token, ip) : false;
      if (!captchaOk) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh the page and try again." },
          { status: 403 }
        );
      }
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const targetUsers = typeof body.targetUsers === "string" ? body.targetUsers.trim() : "";
    const privateMode = body.privateMode === true;

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: "Description must be at least 20 characters" },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: "Description must be under 500 characters" },
        { status: 400 }
      );
    }

    // ------ Local analysis (fast, no API calls) ------
    const selectedCategories = parseSelectedCategories(body);
    const categoryContext = resolveValidationCategories(description, selectedCategories);

    const allProjects = await getProjects();
    const ecosystemStats = getEcosystemStats(allProjects);
    const similar = findSimilarProjects(description, categoryContext.categories, allProjects);

    let trendCategory: string = categoryContext.primaryCategory;
    if (
      categoryContext.source === "user_selected" &&
      categoryContext.inferred.length > 0
    ) {
      const inferredLabels = categoryContext.inferred
        .map((item) => item.category)
        .filter((cat) => cat !== categoryContext.primaryCategory);
      if (inferredLabels.length > 0) {
        trendCategory = `${categoryContext.primaryCategory} (also spans: ${inferredLabels.join(", ")})`;
      }
    }

    // ------ Create job and start background processing ------
    const job = createJob({
      description,
      targetUsers,
      categoryContext,
      similar,
      ecosystemStats,
      trendCategory,
      privateMode,
    });

    // Fire-and-forget: processing continues after response is sent
    processValidationJob(job.id).catch((err) =>
      console.error("[Validate] Background processing failed:", err)
    );

    // Ecosystem intelligence for immediate display
    const [ecosystemIntel, validationStats] = await Promise.all([
      getEcosystemIntelligence(),
      getValidationAggregateStats(),
    ]);
    const catSurvival = ecosystemIntel.categorySurvival.find(
      (c) => c.category === categoryContext.primaryCategory
    );

    return NextResponse.json({
      jobId: job.id,
      status: "processing",
      step: "queued",
      // Include quick local results so frontend can show something immediately
      preview: {
        similarProjects: toSimilarProjectsPayload(similar),
        categoryContext: toCategoryContextPayload(categoryContext),
        ecosystemStats,
        ecosystemIntelligence: {
          overallSurvivalRate: ecosystemIntel.overallSurvivalRate,
          categorySurvival: catSurvival ?? null,
          topDeathPatterns: ecosystemIntel.topDeathPatterns,
        },
        communityStats: {
          totalValidations: validationStats.totalValidations,
          similarIdeaCount: await getSimilarIdeaCount(categoryContext.primaryCategory),
          avgPmfScore: validationStats.avgPmfScore,
        },
      },
    });
  } catch (error) {
    console.error("[Validate] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
