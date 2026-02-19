// =============================================================================
// ShipOrSkip Pipeline — Twitter/X Activity Source
// =============================================================================
// PRIMARY: Grok x_search batch — all handles in one call (~$0.005/batch)
// FALLBACK: Twitter API v2 individual calls
// =============================================================================

import { createLogger } from "../shared/logger";

const logger = createLogger("twitter");

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN ?? "";
const XAI_API_KEY = process.env.XAI_API_KEY ?? "";
const XAI_BASE_URL = "https://api.x.ai/v1";
const TWITTER_API_BASE = "https://api.twitter.com/2";

const BATCH_SIZE = 10;
const TIMEOUT_MS = 30_000;
const DELAY_BETWEEN_CALLS_MS = 2_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwitterActivityResult {
  handle: string;
  lastPostAt: string | null;
  daysSinceLastPost: number | null;
  followers: number | null;
  accountExists: boolean;
  lastPost: string | null;
  source: "twitter_api" | "grok_xsearch" | "unavailable";
  fetchedAt: string;
}

interface GrokBatchEntry {
  handle: string;
  lastPostDate: string | null;
  accountExists: boolean;
  followers: number | null;
  lastPost?: string | null;
  correctHandle?: string | null;
}

interface HandleWithName {
  handle: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function extractTwitterHandle(input: string | null): string | null {
  if (!input) return null;
  const urlMatch = input.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})\/?/);
  if (urlMatch) return urlMatch[1] ?? null;
  if (input.startsWith("@")) return input.slice(1);
  if (/^[A-Za-z0-9_]{1,15}$/.test(input)) return input;
  return null;
}

function daysSince(isoDate: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Grok x_search batch (primary)
// ---------------------------------------------------------------------------

async function fetchViaGrokBatch(
  items: HandleWithName[]
): Promise<Map<string, TwitterActivityResult>> {
  const handles = items.map((i) => i.handle);
  const results = new Map<string, TwitterActivityResult>();
  const now = new Date().toISOString();

  for (const h of handles) {
    results.set(h.toLowerCase(), {
      handle: h,
      lastPostAt: null,
      daysSinceLastPost: null,
      followers: null,
      accountExists: false,
      lastPost: null,
      source: "grok_xsearch",
      fetchedAt: now,
    });
  }

  const fromQuery = items.map((i) => `from:${i.handle}`).join(" OR ");

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    const response = await fetch(`${XAI_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        input: `${fromQuery}\n\nmode: each account, Latest\nlimit: 1\n\nReturn JSON array: [{"handle":"username","lastPostDate":"YYYY-MM-DD","accountExists":true,"followers":12345,"lastPost":"post content","correctHandle":null}]`,
        tools: [
          {
            type: "x_search",
            x_search_count: "high",
            allowed_x_handles: handles,
          },
        ],
        temperature: 0,
      }),
      signal: ctrl.signal,
    });

    clearTimeout(t);

    if (!response.ok) {
      logger.warn(`Grok batch error ${response.status}`);
      return results;
    }

    const data = (await response.json()) as {
      output?: { type?: string; content?: { type?: string; text?: string }[] }[];
    };

    let text = "";
    for (const item of data.output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type === "output_text") text += part.text;
        }
      }
    }

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return results;

    const parsed = JSON.parse(jsonMatch[0]) as GrokBatchEntry[];
    if (!Array.isArray(parsed)) return results;

    for (const entry of parsed) {
      if (!entry.handle) continue;
      const key = entry.handle.toLowerCase().replace(/^@/, "");
      const existing = results.get(key);
      if (!existing) continue;

      existing.accountExists = entry.accountExists ?? false;
      existing.followers = entry.followers ?? null;
      if (entry.correctHandle) {
        existing.handle = entry.correctHandle.replace(/^@/, "");
      }
      if (entry.lastPostDate) {
        existing.lastPostAt = entry.lastPostDate;
        existing.daysSinceLastPost = daysSince(entry.lastPostDate);
      }
      existing.lastPost = entry.lastPost ?? null;
    }

    return results;
  } catch (err: unknown) {
    logger.error("Grok batch x_search error", err);
    return results;
  }
}

// ---------------------------------------------------------------------------
// Twitter API v2 individual fallback
// ---------------------------------------------------------------------------

async function fetchViaTwitterAPI(handle: string): Promise<TwitterActivityResult> {
  const base: TwitterActivityResult = {
    handle,
    lastPostAt: null,
    daysSinceLastPost: null,
    followers: null,
    accountExists: false,
    lastPost: null,
    source: "twitter_api",
    fetchedAt: new Date().toISOString(),
  };

  try {
    const userRes = await fetchWithTimeout(
      `${TWITTER_API_BASE}/users/by/username/${handle}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` } }
    );

    if (!userRes.ok) {
      return userRes.status === 429 ? { ...base, source: "unavailable" } : base;
    }

    const userData = (await userRes.json()) as {
      data?: { id?: string; public_metrics?: { followers_count?: number } };
    };
    const userId = userData.data?.id;
    const followers = userData.data?.public_metrics?.followers_count ?? null;
    if (!userId) return base;

    base.accountExists = true;
    base.followers = followers;

    const tweetsRes = await fetchWithTimeout(
      `${TWITTER_API_BASE}/users/${userId}/tweets?max_results=1&tweet.fields=created_at&exclude=retweets,replies`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` } }
    );

    if (!tweetsRes.ok) return { ...base, source: "unavailable" };

    const td = (await tweetsRes.json()) as { data?: { created_at?: string }[] };
    const tweet = td.data?.[0];
    if (tweet?.created_at) {
      base.lastPostAt = tweet.created_at;
      base.daysSinceLastPost = daysSince(tweet.created_at);
    }

    return base;
  } catch (err: unknown) {
    logger.error(`Twitter API error for @${handle}`, err);
    return { ...base, source: "unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Main batch export
// ---------------------------------------------------------------------------

export async function fetchTwitterActivityBatch(
  handles: { slug: string; handle: string; name: string }[]
): Promise<Map<string, TwitterActivityResult>> {
  const results = new Map<string, TwitterActivityResult>();

  if (!XAI_API_KEY && !TWITTER_BEARER_TOKEN) {
    logger.warn("No XAI_API_KEY or TWITTER_BEARER_TOKEN — skipping Twitter");
    return results;
  }

  logger.info(`Fetching Twitter activity for ${handles.length} projects`);

  if (XAI_API_KEY) {
    const batches: { slug: string; handle: string; name: string }[][] = [];
    for (let i = 0; i < handles.length; i += BATCH_SIZE) {
      batches.push(handles.slice(i, i + BATCH_SIZE));
    }

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b]!;
      const batchItems = batch.map((h) => ({ handle: h.handle, name: h.name }));
      logger.info(`Grok batch ${b + 1}/${batches.length}: ${batchItems.length} handles`);
      const batchResults = await fetchViaGrokBatch(batchItems);

      for (const { slug, handle } of batch) {
        const result = batchResults.get(handle.toLowerCase());
        results.set(
          slug,
          result ?? {
            handle,
            lastPostAt: null,
            daysSinceLastPost: null,
            followers: null,
            accountExists: false,
            lastPost: null,
            source: "unavailable",
            fetchedAt: new Date().toISOString(),
          }
        );
      }

      if (b < batches.length - 1) await sleep(1_000);
    }

    return results;
  }

  // Fallback: individual Twitter API v2
  for (let i = 0; i < handles.length; i++) {
    const { slug, handle } = handles[i]!;
    results.set(slug, await fetchViaTwitterAPI(handle));
    if (i < handles.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  return results;
}

export async function fetchTwitterActivity(
  handle: string
): Promise<TwitterActivityResult> {
  if (XAI_API_KEY) {
    const r = await fetchViaGrokBatch([{ handle, name: handle }]);
    return (
      r.get(handle.toLowerCase()) ?? {
        handle,
        lastPostAt: null,
        daysSinceLastPost: null,
        followers: null,
        accountExists: false,
        lastPost: null,
        source: "unavailable",
        fetchedAt: new Date().toISOString(),
      }
    );
  }
  if (TWITTER_BEARER_TOKEN) return fetchViaTwitterAPI(handle);

  return {
    handle,
    lastPostAt: null,
    daysSinceLastPost: null,
    followers: null,
    accountExists: false,
    lastPost: null,
    source: "unavailable",
    fetchedAt: new Date().toISOString(),
  };
}
