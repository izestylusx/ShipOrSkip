// =============================================================================
// ShipOrSkip - Kimi K2.5 API Helper
// =============================================================================
// Kimi K2.5 (kimi-for-coding) is used for two roles:
//   1. Reddit/web community intel via $web_search tool
//   2. Primary validation verdict (reasoning model with reasoning_content)
//
// Grok remains the owner of X/Twitter intel (x_search — Kimi cannot do this).
// Grok verdict is used as fallback if Kimi fails.
//
// API: Moonshot AI (https://api.kimi.com/coding/v1) — OpenAI-compatible
// Model: kimi-for-coding
// Env: KIMI_API_KEY

import type { GrokValidationVerdict } from "@/lib/grok-api";

const KIMI_API_KEY = process.env.KIMI_API_KEY ?? "";
const KIMI_BASE_URL =
  process.env.KIMI_BASE_URL ?? "https://api.kimi.com/coding/v1";
const KIMI_MODEL = process.env.KIMI_MODEL ?? "kimi-for-coding";
const KIMI_USER_AGENT = process.env.KIMI_USER_AGENT ?? "KimiCLI/1.3";
const DEFAULT_KIMI_TIMEOUT_MS = 30_000; // Reddit intel only — non-critical, fail fast

function readTimeoutMs(envKey: string, defaultMs: number): number {
  const raw = process.env[envKey];
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultMs;
  return Math.floor(parsed);
}

const KIMI_TIMEOUT_MS = readTimeoutMs("KIMI_TIMEOUT_MS", DEFAULT_KIMI_TIMEOUT_MS);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedditThread {
  subreddit: string;
  title: string;
  url: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
}

export interface RedditCommunityIntel {
  communityBuzz: "high" | "moderate" | "low" | "none";
  relevantThreads: RedditThread[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  keyInsights: string[];
}

interface KimiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  reasoning_content?: string;
  tool_calls?: KimiToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface KimiToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface KimiChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_content?: string;
      tool_calls?: KimiToolCall[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message: string };
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function kimiChat(
  messages: KimiMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    tools?: Array<{ type: string; function?: { name: string; description: string } }>;
    disableThinking?: boolean;
  } = {}
): Promise<{
  data: string | null;
  reasoning: string | null;
  toolCalls: KimiToolCall[] | null;
  finishReason: string | null;
  rawMessage: KimiMessage | null;
  error: string | null;
}> {
  if (!KIMI_API_KEY) {
    return { data: null, reasoning: null, toolCalls: null, finishReason: null, rawMessage: null, error: "KIMI_API_KEY not set" };
  }

  const {
    temperature = 0.3,
    maxTokens = 4096,
    timeoutMs = KIMI_TIMEOUT_MS,
    tools,
    disableThinking = false,
  } = options;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const body: Record<string, unknown> = {
      model: KIMI_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    // $web_search is incompatible with thinking mode (Kimi API limitation)
    if (disableThinking) {
      body.thinking = { type: "disabled" };
    }

    const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
        "User-Agent": KIMI_USER_AGENT,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      return { data: null, reasoning: null, toolCalls: null, finishReason: null, rawMessage: null, error: "Kimi API rate limited" };
    }

    if (!res.ok) {
      const resBody = await res.text();
      return {
        data: null,
        reasoning: null,
        toolCalls: null,
        finishReason: null,
        rawMessage: null,
        error: `Kimi HTTP ${res.status}: ${resBody.substring(0, 300)}`,
      };
    }

    const json: KimiChatResponse = await res.json();

    if (json.error) {
      return { data: null, reasoning: null, toolCalls: null, finishReason: null, rawMessage: null, error: json.error.message };
    }

    const choice = json.choices?.[0];
    const message = choice?.message;
    const content = message?.content ?? null;
    const reasoning = message?.reasoning_content ?? null;
    const toolCalls = message?.tool_calls ?? null;
    const finishReason = choice?.finish_reason ?? null;
    const totalTokens = json.usage?.total_tokens ?? 0;

    if (totalTokens > 0) {
      console.log(`[Kimi] ${KIMI_MODEL} used ${totalTokens} tokens`);
    }

    // Reconstruct raw message for multi-turn use — Kimi requires reasoning_content
    // to be present (even as empty string) when adding back to message history
    const rawMessage: KimiMessage = {
      role: "assistant",
      content: content ?? "",
      reasoning_content: reasoning ?? "",
      ...(toolCalls ? { tool_calls: toolCalls } : {}),
    };

    return { data: content, reasoning, toolCalls, finishReason, rawMessage, error: null };
  } catch (err) {
    const msg =
      (err as Error).name === "AbortError"
        ? `Kimi API timed out after ${Math.floor(timeoutMs / 1000)}s`
        : (err as Error).message;
    return { data: null, reasoning: null, toolCalls: null, finishReason: null, rawMessage: null, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Multi-turn tool call handler for $web_search
// Kimi executes $web_search server-side, but requires a follow-up request
// to process the injected search results into a final answer.
// ---------------------------------------------------------------------------

const WEB_SEARCH_TOOL = [
  {
    type: "builtin_function",
    function: {
      name: "$web_search",
      description: "Search the web for current information",
    },
  },
];

async function kimiChatWithWebSearch(
  messages: KimiMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number; maxTurns?: number } = {}
): Promise<{ data: string | null; error: string | null }> {
  const maxTurns = options.maxTurns ?? 5;
  const allMessages: KimiMessage[] = [...messages];
  for (let turn = 0; turn < maxTurns; turn++) {
    const result = await kimiChat(allMessages, {
      ...options,
      tools: WEB_SEARCH_TOOL,
      disableThinking: true, // required for $web_search
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    // Not a tool call — model has final answer
    if (result.finishReason !== "tool_calls" || !result.toolCalls) {
      return { data: result.data, error: null };
    }

    // Tool calls triggered — add assistant message back with reasoning_content
    if (result.rawMessage) {
      allMessages.push(result.rawMessage);
    }

    // Add tool result messages so Kimi can process search results
    for (const tc of result.toolCalls) {
      console.log(`[Kimi] $web_search triggered: ${tc.function?.arguments?.substring(0, 120)}`);
      allMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        name: tc.function?.name ?? "$web_search",
        content: "Search completed. Analyze the search results and provide your response.",
      });
    }

  }

  return { data: null, error: "Kimi $web_search exceeded max turns without final answer" };
}

// ---------------------------------------------------------------------------
// JSON extraction helper (strips markdown fences if present)
// ---------------------------------------------------------------------------

function extractJson(raw: string): string {
  return raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
}

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

// ---------------------------------------------------------------------------
// 1. Reddit community intel via $web_search
// ---------------------------------------------------------------------------

const REDDIT_INTEL_SYSTEM_PROMPT = `You are a startup market researcher.
Search the web for discussions in startup and SaaS communities on Reddit.
Focus on subreddits: r/startup_ideas, r/startupideas, r/appideas, r/SaaS, r/startupaccelerators.
Always respond in strict JSON format only. No markdown, no explanations outside JSON.`;

function buildRedditIntelPrompt(ideaDescription: string): string {
  return `Search Reddit for community discussions relevant to this startup idea:

"${ideaDescription}"

Search these subreddits: r/startup_ideas, r/startupideas, r/appideas, r/SaaS, r/startupaccelerators

Find:
1. Threads where people ask for this type of product or validate the need
2. Threads where people tried building something similar
3. Overall community sentiment about this type of idea

Return strict JSON only:
{
  "communityBuzz": "high" | "moderate" | "low" | "none",
  "relevantThreads": [
    {
      "subreddit": "r/SaaS",
      "title": "Thread title here",
      "url": "https://reddit.com/...",
      "sentiment": "positive" | "negative" | "neutral",
      "summary": "One sentence summary of what the thread discusses"
    }
  ],
  "sentimentBreakdown": {
    "positive": 60,
    "negative": 20,
    "neutral": 20
  },
  "keyInsights": [
    "Insight 1 about community demand or concerns",
    "Insight 2 about similar attempts"
  ]
}

If no relevant threads found, return communityBuzz: "none" with empty arrays.`;
}

export async function getRedditCommunityIntel(
  ideaDescription: string
): Promise<RedditCommunityIntel | null> {
  if (!KIMI_API_KEY) return null;

  const { data, error } = await kimiChatWithWebSearch(
    [
      { role: "system", content: REDDIT_INTEL_SYSTEM_PROMPT },
      { role: "user", content: buildRedditIntelPrompt(ideaDescription) },
    ],
    { temperature: 0.3, maxTokens: 2048 }
  );

  if (error || !data) {
    console.warn("[Kimi] Reddit community intel failed:", error);
    return null;
  }

  try {
    const parsed = JSON.parse(extractJson(data)) as Record<string, unknown>;

    const buzz = (["high", "moderate", "low", "none"] as const).includes(
      parsed.communityBuzz as "high" | "moderate" | "low" | "none"
    )
      ? (parsed.communityBuzz as RedditCommunityIntel["communityBuzz"])
      : "none";

    const rawThreads = Array.isArray(parsed.relevantThreads) ? parsed.relevantThreads : [];
    const threads: RedditThread[] = rawThreads
      .map((t: unknown) => {
        if (typeof t !== "object" || t === null) return null;
        const obj = t as Record<string, unknown>;
        return {
          subreddit: readString(obj.subreddit, "r/unknown"),
          title: readString(obj.title),
          url: readString(obj.url),
          sentiment: (["positive", "negative", "neutral"] as const).includes(
            obj.sentiment as "positive" | "negative" | "neutral"
          )
            ? (obj.sentiment as RedditThread["sentiment"])
            : "neutral",
          summary: readString(obj.summary),
        };
      })
      .filter((t): t is RedditThread => t !== null && t.title.length > 0);

    const rawBreakdown =
      typeof parsed.sentimentBreakdown === "object" && parsed.sentimentBreakdown !== null
        ? (parsed.sentimentBreakdown as Record<string, unknown>)
        : {};

    const rawInsights = Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [];
    const insights = rawInsights
      .filter((i): i is string => typeof i === "string" && i.length > 0)
      .slice(0, 5);

    console.log(`[Kimi] Reddit community intel complete (${threads.length} threads, buzz: ${buzz})`);

    return {
      communityBuzz: buzz,
      relevantThreads: threads,
      sentimentBreakdown: {
        positive: readNumber(rawBreakdown.positive, 0),
        negative: readNumber(rawBreakdown.negative, 0),
        neutral: readNumber(rawBreakdown.neutral, 100),
      },
      keyInsights: insights,
    };
  } catch {
    console.error("[Kimi] Failed to parse Reddit intel JSON:", data.substring(0, 300));
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Primary validation verdict (reasoning model)
// ---------------------------------------------------------------------------

const KIMI_VERDICT_SYSTEM_PROMPT = `You are ShipOrSkip AI. Return only a strict JSON object.
Do not include markdown, explanations outside JSON, or code fences.`;

export async function getKimiValidationVerdict(prompt: string): Promise<{
  verdict: GrokValidationVerdict | null;
  error: string | null;
}> {
  if (!KIMI_API_KEY) {
    return { verdict: null, error: "KIMI_API_KEY not set" };
  }

  const { data, reasoning, error } = await kimiChat(
    [
      { role: "system", content: KIMI_VERDICT_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { temperature: 0.2, maxTokens: 1400 }
    // No tools for verdict — all context already in prompt
    // No disableThinking — allow reasoning_content for better quality
  );

  if (reasoning) {
    console.log(`[Kimi] Reasoning length: ${reasoning.length} chars`);
  }

  if (error) {
    return { verdict: null, error };
  }

  // Kimi reasoning model sometimes returns the JSON answer in reasoning_content
  // rather than content when the thinking is deep. Use whichever is non-empty.
  const raw = data ?? reasoning;
  if (!raw) {
    return { verdict: null, error: "Empty response from Kimi" };
  }

  try {
    const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>;
    const pmfScore = Math.max(0, Math.min(100, readNumber(parsed.pmfScore, 50)));

    console.log(`[Kimi] Verdict complete (signal: ${parsed.signal}, pmfScore: ${pmfScore})`);

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
    return { verdict: null, error: "Kimi returned unparseable JSON" };
  }
}

// ---------------------------------------------------------------------------
// 3. Availability check
// ---------------------------------------------------------------------------

export const isKimiEnabled = (): boolean => !!KIMI_API_KEY;
