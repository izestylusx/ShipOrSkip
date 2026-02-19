// =============================================================================
// ShipOrSkip - Grok AI API Helper (with Agent Tools API)
// =============================================================================
// Grok (by xAI) uses x_search tool via the Responses API (/v1/responses)
// to access real-time X/Twitter data. Web data comes from our local dataset.
//
// Architecture:
//   - Intel calls (trend only): use /v1/responses with x_search
//     tool for live narrative/timing data from X/Twitter
//   - Verdict call (reasoning): plain /v1/chat/completions with structured
//     prompt. All context already gathered by intel calls, no tools needed.
//
// API: xAI (https://api.x.ai/v1)
// Models: grok-4 family (required for server-side tools)
// Env: XAI_API_KEY

const XAI_API_KEY = process.env.XAI_API_KEY ?? "";
const BASE_URL = "https://api.x.ai/v1";
const INTEL_MODEL =
  process.env.VALIDATE_GROK_INTEL_MODEL ?? "grok-4-1-fast-non-reasoning";
const VERDICT_MODEL =
  process.env.VALIDATE_GROK_VERDICT_MODEL ?? "grok-4-1-fast-reasoning";
const DEFAULT_GROK_INTEL_TIMEOUT_MS = 120_000; // tool-enabled calls need more time
const DEFAULT_GROK_VERDICT_TIMEOUT_MS = 90_000; // final reasoning verdict

function readTimeoutMs(envKey: string, defaultMs: number): number {
  const raw = process.env[envKey];
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultMs;
  return Math.floor(parsed);
}

const GROK_INTEL_TIMEOUT_MS = readTimeoutMs(
  "VALIDATE_GROK_TIMEOUT_MS",
  DEFAULT_GROK_INTEL_TIMEOUT_MS
);
const GROK_VERDICT_TIMEOUT_MS = readTimeoutMs(
  "VALIDATE_GROK_VERDICT_TIMEOUT_MS",
  DEFAULT_GROK_VERDICT_TIMEOUT_MS
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopicTweet {
  author: string;
  text: string;
  context: string;
}

export interface GrokTrendAnalysis {
  categoryTrend: "rising" | "stable" | "declining";
  trendScore: number;
  narrativeSummary: string;
  risingKeywords: string[];
  decliningKeywords: string[];
  timingVerdict: string;
  competitorLandscape: string;
  twitterBuzzLevel: "high" | "moderate" | "low" | "none";
  topicTweets: TopicTweet[];
}

export interface GrokValidationIntel {
  trendAnalysis: GrokTrendAnalysis;
}

export interface GrokValidationVerdict {
  signal: "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION";
  pmfScore: number;
  deathPatterns: string;
  biggestRisk: string;
  recommendation: string;
  edgeNeeded: string;
  timingAssessment: string;
  trendInsight: string;
}

// ---------------------------------------------------------------------------
// Server-side tool definitions for xAI Agent Tools API
// The new Agent Tools API uses `/v1/responses` with separate `web_search`
// and `x_search` tools. The old `live_search` on `/v1/chat/completions`
// has been deprecated (HTTP 410).
// ---------------------------------------------------------------------------

interface XSearchTool {
  type: "x_search";
  allowed_x_handles?: string[];
  excluded_x_handles?: string[];
  from_date?: string;
  to_date?: string;
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
}

type GrokServerTool = XSearchTool;

// ---------------------------------------------------------------------------
// Core fetch helpers
// - Tool-enabled calls → /v1/responses (Agent Tools API)
// - Plain calls (verdict) → /v1/chat/completions
// ---------------------------------------------------------------------------

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Responses API output shape
interface GrokResponsesOutput {
  id?: string;
  // The Responses API returns an `output` array with message items
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { message: string };
}

// Chat completions output shape (for non-tool calls)
interface GrokChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    num_sources_used?: number;
  };
  error?: { message: string };
}

interface GrokChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  tools?: GrokServerTool[];
}

async function grokChat(
  messages: GrokMessage[],
  options: GrokChatOptions = {}
): Promise<{ data: string | null; error: string | null; sourcesUsed?: number }> {
  if (!XAI_API_KEY) {
    return { data: null, error: "XAI_API_KEY not set" };
  }

  const {
    model = INTEL_MODEL,
    temperature = 0.3,
    maxTokens = 2048,
    timeoutMs = GROK_INTEL_TIMEOUT_MS,
    tools,
  } = options;

  const useResponsesAPI = tools && tools.length > 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let endpoint: string;
    let body: Record<string, unknown>;

    if (useResponsesAPI) {
      // Agent Tools API: /v1/responses
      // Converts messages to the `input` format expected by Responses API
      endpoint = `${BASE_URL}/responses`;

      const instructions = messages.find((m) => m.role === "system")?.content ?? "";
      const userMessage = messages.find((m) => m.role === "user")?.content ?? "";

      body = {
        model,
        instructions,
        input: userMessage,
        temperature,
        max_output_tokens: maxTokens,
        tools,
      };
    } else {
      // Standard chat completions: /v1/chat/completions
      endpoint = `${BASE_URL}/chat/completions`;
      body = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      return { data: null, error: "Grok API rate limited" };
    }

    if (!res.ok) {
      const resBody = await res.text();
      return { data: null, error: `Grok HTTP ${res.status}: ${resBody.substring(0, 300)}` };
    }

    if (useResponsesAPI) {
      // Parse Responses API output
      const json: GrokResponsesOutput = await res.json();

      if (json.error) {
        return { data: null, error: json.error.message };
      }

      // Extract text from output items
      const textParts: string[] = [];
      for (const item of json.output ?? []) {
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const block of item.content) {
            if (block.type === "output_text" && block.text) {
              textParts.push(block.text);
            }
          }
        }
      }

      const content = textParts.join("\n").trim() || null;
      const totalTokens = json.usage?.total_tokens ?? 0;

      if (totalTokens > 0) {
        console.log(`[Grok] ${model} used ${totalTokens} tokens (Responses API)`);
      }

      return { data: content, error: null, sourcesUsed: totalTokens > 0 ? 1 : 0 };
    } else {
      // Parse chat completions output
      const json: GrokChatResponse = await res.json();

      if (json.error) {
        return { data: null, error: json.error.message };
      }

      const content = json.choices?.[0]?.message?.content ?? null;
      const sourcesUsed = json.usage?.num_sources_used ?? 0;

      if (sourcesUsed > 0) {
        console.log(`[Grok] ${model} used ${sourcesUsed} sources`);
      }

      return { data: content, error: null, sourcesUsed };
    }
  } catch (err) {
    const msg =
      (err as Error).name === "AbortError"
        ? `Grok API timed out after ${Math.floor(timeoutMs / 1000)}s`
        : (err as Error).message;
    return { data: null, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Tool preset builders
// ---------------------------------------------------------------------------

function buildIntelTools(): GrokServerTool[] {
  // Only x_search needed — trend analysis operates on X/Twitter data.
  // Web data (projects, market cap, etc.) is already in our
  // local dataset from CoinGecko enrichment. Skipping web_search saves
  // significant cost (fewer tool invocations + fewer browsed-page tokens).
  return [{ type: "x_search" }];
}

// ---------------------------------------------------------------------------
// 1. Twitter Trend Analysis (contextual to user's idea)
//    Uses x_search (Responses API) for real-time narrative trends on X/Twitter
// ---------------------------------------------------------------------------

const TREND_SYSTEM_PROMPT = `You are a crypto/Web3 trend analyst.
Your specialty is identifying narrative trends, emerging categories, and timing signals in the BNB Chain (BSC) ecosystem.

You have access to the x_search tool. USE IT to gather real-time data:
- Search X/Twitter for trending topics related to the category
- Look for community discussions, sentiment signals, and buzz levels
- Find recent announcements and narratives being discussed on crypto Twitter

Provide data-backed analysis based on your X/Twitter search results.
Reference real tweets or discussions you find through the x_search tool.
Always respond in valid JSON format.`;

function buildTrendPrompt(ideaDescription: string, category: string): string {
  return `Analyze current Twitter/X trends relevant to this BNB Chain project idea:

**Idea:** ${ideaDescription}
**Category scope:** ${category}

IMPORTANT: Use your search tools to find real-time data on X/Twitter
for current discussions, launches, and sentiment about this type of project.

Focus your trend analysis on the SPECIFIC idea described above, not just
the broad category label. The idea may span multiple categories (e.g., an AI agent for
DeFi yield is primarily about AI agents, not just DEXes). Analyze trends for the idea's
core value proposition.

For "Topic Tweets": Find tweets from REAL USERS, builders, influencers, or analysts
who are specifically discussing the THEME of this idea — NOT tweets from existing
competitor project accounts posting about themselves. We want to gauge genuine community
interest and market momentum. For example:
  - Users asking "when will someone build X?"
  - Influencers discussing the opportunity in this space
  - Builders sharing their experience with similar concepts
  - Analysts commenting on the trend/demand for this type of product

Analyze the following using your search results:

1. **Category Trend:** Is this TYPE of idea rising, stable, or declining on BNB Chain?
   (Check tweets, discussions, launches from the past 2-4 weeks)

2. **Trend Score (0-100):** How much buzz does this type of idea have right now?
   - 80-100: Trending hot, lots of discussions
   - 50-79: Moderate interest
   - 20-49: Low interest
   - 0-19: Dead/no discussions

3. **Narrative Summary:** What's the current narrative around this type of idea?

4. **Rising Keywords:** What related keywords/topics are gaining traction?

5. **Declining Keywords:** What related topics are losing steam?

6. **Timing Verdict:** Is NOW a good time to launch this type of project on BNB? Why?

7. **Competitor Landscape:** What similar announcements or launches have happened recently?

8. **Twitter Buzz Level:** Overall buzz for this specific idea concept (high/moderate/low/none)

9. **Topic Tweets:** Find 3-5 recent tweets from real users or influencers who are
   discussing the THEME or CONCEPT of this idea. Each tweet must include:
   - author: The X handle of the person tweeting
   - text: A paraphrase of what they said (keep it concise)
   - context: Why this tweet is relevant (e.g., "shows user demand", "validates timing")
   IMPORTANT: Do NOT include tweets from competitor project official accounts.
   We want organic community interest, not competitor marketing.

Respond in this exact JSON format:
{
  "categoryTrend": "rising",
  "trendScore": 72,
  "narrativeSummary": "AI agents on BNB are seeing increased interest after...",
  "risingKeywords": ["AI agent", "autonomous", "DeFAI"],
  "decliningKeywords": ["GameFi", "P2E", "metaverse"],
  "timingVerdict": "Good timing - category interest is growing but not oversaturated yet",
  "competitorLandscape": "3 new AI agent projects announced on BNB this week...",
  "twitterBuzzLevel": "moderate",
  "topicTweets": [
    {
      "author": "@crypto_analyst",
      "text": "BNB Chain AI agent space is heating up - seeing real demand for automated yield strategies",
      "context": "Shows growing community interest in AI + DeFi on BNB"
    },
    {
      "author": "@defi_builder",
      "text": "Anyone building AI yield agents on BSC? The infrastructure is finally ready",
      "context": "Builder sentiment validates the technical feasibility"
    }
  ]
}`;
}

export async function getTrendAnalysis(
  ideaDescription: string,
  category: string
): Promise<GrokTrendAnalysis | null> {
  if (!XAI_API_KEY) return null;

  const { data, error, sourcesUsed } = await grokChat(
    [
      { role: "system", content: TREND_SYSTEM_PROMPT },
      { role: "user", content: buildTrendPrompt(ideaDescription, category) },
    ],
    {
      temperature: 0.4,
      maxTokens: 1200,
      tools: buildIntelTools(),
      timeoutMs: GROK_INTEL_TIMEOUT_MS,
    }
  );

  if (error || !data) {
    console.warn("[Grok] Trend analysis failed:", error);
    return null;
  }

  console.log(`[Grok] Trend analysis complete (${sourcesUsed ?? 0} sources used)`);

  try {
    const cleaned = data.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Parse topic tweets — accept both new structured format and legacy string[]
    let topicTweets: TopicTweet[] = [];
    const rawTweets = parsed.topicTweets ?? parsed.relevantTweets ?? [];
    if (Array.isArray(rawTweets)) {
      topicTweets = rawTweets.map((item: unknown) => {
        if (typeof item === "string") {
          // Legacy string format — extract author if format is "@handle: text"
          const match = (item as string).match(/^@?(\w+)[:.]?\s*([\s\S]+)$/);
          return {
            author: match ? `@${match[1]}` : "Unknown",
            text: match ? match[2].trim() : item as string,
            context: "",
          };
        }
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return {
            author: typeof obj.author === "string" ? obj.author : "Unknown",
            text: typeof obj.text === "string" ? obj.text : "",
            context: typeof obj.context === "string" ? obj.context : "",
          };
        }
        return { author: "Unknown", text: String(item), context: "" };
      }).filter((t: TopicTweet) => t.text.length > 0);
    }

    return {
      categoryTrend: parsed.categoryTrend ?? "stable",
      trendScore: Math.max(0, Math.min(100, parsed.trendScore ?? 50)),
      narrativeSummary: parsed.narrativeSummary ?? "",
      risingKeywords: parsed.risingKeywords ?? [],
      decliningKeywords: parsed.decliningKeywords ?? [],
      timingVerdict: parsed.timingVerdict ?? "",
      competitorLandscape: parsed.competitorLandscape ?? "",
      twitterBuzzLevel: parsed.twitterBuzzLevel ?? "low",
      topicTweets,
    };
  } catch {
    console.error("[Grok] Failed to parse trend analysis JSON:", data.substring(0, 300));
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Combined validation intel - single entry point
//    Runs trend analysis only
// ---------------------------------------------------------------------------

export async function getValidationIntel(
  ideaDescription: string,
  category: string
): Promise<GrokValidationIntel | null> {
  if (!XAI_API_KEY) return null;

  const trendResult = await getTrendAnalysis(ideaDescription, category);
  if (!trendResult) return null;

  return {
    trendAnalysis: trendResult,
  };
}

// ---------------------------------------------------------------------------
// 3. Final validation verdict (reasoning model, no tools needed)
// ---------------------------------------------------------------------------

const VALIDATION_VERDICT_SYSTEM_PROMPT = `You are ShipOrSkip AI. Return only a strict JSON object.
Do not include markdown, explanations outside JSON, or code fences.`;

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readSignal(value: unknown): GrokValidationVerdict["signal"] {
  if (value === "SHIP" || value === "HIGH_RISK" || value === "SHIP_WITH_CAUTION") {
    return value;
  }
  return "SHIP_WITH_CAUTION";
}

export async function getValidationVerdict(prompt: string): Promise<{
  verdict: GrokValidationVerdict | null;
  error: string | null;
}> {
  if (!XAI_API_KEY) {
    return { verdict: null, error: "XAI_API_KEY not set" };
  }

  const { data, error } = await grokChat(
    [
      { role: "system", content: VALIDATION_VERDICT_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    {
      model: VERDICT_MODEL,
      temperature: 0.2,
      maxTokens: 1400,
      timeoutMs: GROK_VERDICT_TIMEOUT_MS,
      // No tools needed: verdict uses pre-gathered intel context
    }
  );

  if (error || !data) {
    return { verdict: null, error: error ?? "Empty response from Grok" };
  }

  try {
    const cleaned = data.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const pmfScore = Math.max(0, Math.min(100, readNumber(parsed.pmfScore, 50)));

    return {
      verdict: {
        signal: readSignal(parsed.signal),
        pmfScore,
        deathPatterns: readString(parsed.deathPatterns),
        biggestRisk: readString(parsed.biggestRisk),
        recommendation: readString(parsed.recommendation),
        edgeNeeded: readString(parsed.edgeNeeded),
        timingAssessment: readString(parsed.timingAssessment),
        trendInsight: readString(parsed.trendInsight),
      },
      error: null,
    };
  } catch {
    return { verdict: null, error: "Grok returned unparseable JSON" };
  }
}

// ---------------------------------------------------------------------------
// 4. Availability check
// ---------------------------------------------------------------------------

export const isGrokEnabled = (): boolean => !!XAI_API_KEY;
