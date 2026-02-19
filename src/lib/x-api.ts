// =============================================================================
// ShipOrSkip — X (Twitter) API Helper
// =============================================================================
// Used ON-DEMAND during idea validation, NOT batch enrichment.
//
// Strategy (cost-efficient):
//   1. batchUserLookup()  — up to 100 usernames in 1 request (~$0.02)
//   2. getMentionCount()  — tweet count for a search query (~$0.02)
//   3. getLastTweetDate() — most recent tweet from a user (~$0.02)
//
// Typical validation: 3-5 similar projects → ~5-8 requests → ~$0.15
//
// Rate limits (Basic tier):
//   - User lookup: 300 req/15min
//   - Recent search: 450 req/15min
//   - Tweet counts: 300 req/15min
//   - User tweets: 900 req/15min

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN ?? "";
const BASE_URL = "https://api.x.com/2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface XUserProfile {
  id: string;
  username: string;
  name: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  likeCount: number;
  description: string | null;
  createdAt: string | null;
}

export interface XMentionStats {
  query: string;
  totalMentions7d: number;
  /** Hourly breakdown (last 7 days) */
  dailyAvg: number;
}

export interface XLastActivity {
  username: string;
  lastTweetDate: string | null;
  lastTweetText: string | null;
  /** Days since last tweet */
  daysSinceLastTweet: number | null;
}

export interface XCompetitorSignal {
  username: string;
  profile: XUserProfile | null;
  lastActivity: XLastActivity;
  mentionStats: XMentionStats;
}

export interface XRecentPost {
  id: string;
  createdAt: string | null;
  text: string;
}

export interface XCompetitorRecentPosts {
  username: string;
  followers: number | null;
  posts: XRecentPost[];
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function xFetch<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  if (!BEARER_TOKEN) {
    return { data: null, error: "TWITTER_BEARER_TOKEN not set" };
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    });

    if (res.status === 429) {
      const resetAt = res.headers.get("x-rate-limit-reset");
      return { data: null, error: `Rate limited. Resets at ${resetAt}` };
    }

    if (!res.ok) {
      const body = await res.text();
      return { data: null, error: `HTTP ${res.status}: ${body.substring(0, 200)}` };
    }

    const json = await res.json();
    return { data: json as T, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// 1. Batch user lookup — up to 100 usernames in 1 request
// ---------------------------------------------------------------------------

interface XUserLookupResponse {
  data?: Array<{
    id: string;
    username: string;
    name: string;
    created_at?: string;
    description?: string;
    public_metrics?: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
      listed_count: number;
      like_count: number;
    };
  }>;
  errors?: Array<{ detail: string }>;
}

/**
 * Look up multiple X users at once. Max 100 per request.
 * Cost: 1 request per batch of 100 usernames.
 */
export async function batchUserLookup(usernames: string[]): Promise<Map<string, XUserProfile>> {
  const results = new Map<string, XUserProfile>();
  if (usernames.length === 0) return results;

  // Chunk into batches of 100
  const chunks: string[][] = [];
  for (let i = 0; i < usernames.length; i += 100) {
    chunks.push(usernames.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const joined = chunk.join(",");
    const fields = "created_at,description,public_metrics";
    const { data, error } = await xFetch<XUserLookupResponse>(
      `/users/by?usernames=${joined}&user.fields=${fields}`
    );

    if (error) {
      console.warn(`[X API] User lookup error: ${error}`);
      continue;
    }

    if (data?.data) {
      for (const u of data.data) {
        const pm = u.public_metrics;
        results.set(u.username.toLowerCase(), {
          id: u.id,
          username: u.username,
          name: u.name,
          followersCount: pm?.followers_count ?? 0,
          followingCount: pm?.following_count ?? 0,
          tweetCount: pm?.tweet_count ?? 0,
          listedCount: pm?.listed_count ?? 0,
          likeCount: pm?.like_count ?? 0,
          description: u.description ?? null,
          createdAt: u.created_at ?? null,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 2. Mention count — how many tweets mention a query in last 7 days
// ---------------------------------------------------------------------------

interface XTweetCountResponse {
  data?: Array<{
    start: string;
    end: string;
    tweet_count: number;
  }>;
  meta?: { total_tweet_count: number };
}

/**
 * Get total tweet count mentioning a query over last 7 days.
 * Uses /2/tweets/counts/recent — 1 request per query.
 * Query can be a project name, handle, or keyword.
 */
export async function getMentionCount(query: string): Promise<XMentionStats> {
  const encoded = encodeURIComponent(query);
  const { data, error } = await xFetch<XTweetCountResponse>(
    `/tweets/counts/recent?query=${encoded}&granularity=day`
  );

  if (error || !data?.meta) {
    return { query, totalMentions7d: 0, dailyAvg: 0 };
  }

  const total = data.meta.total_tweet_count;
  return {
    query,
    totalMentions7d: total,
    dailyAvg: Math.round(total / 7),
  };
}

// ---------------------------------------------------------------------------
// 3. Last tweet date — when did a user last post?
// ---------------------------------------------------------------------------

interface XUserTweetsResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
  }>;
}

/**
 * Get the most recent tweet from a user.
 * Uses /2/users/:id/tweets — 1 request per user.
 * Requires the user ID (get from batchUserLookup first).
 */
export async function getLastTweetDate(userId: string, username: string): Promise<XLastActivity> {
  const { data, error } = await xFetch<XUserTweetsResponse>(
    `/users/${userId}/tweets?max_results=5&tweet.fields=created_at&exclude=retweets,replies`
  );

  if (error || !data?.data?.length) {
    return {
      username,
      lastTweetDate: null,
      lastTweetText: null,
      daysSinceLastTweet: null,
    };
  }

  const latest = data.data[0];
  const lastDate = latest.created_at ?? null;
  let daysSince: number | null = null;

  if (lastDate) {
    const diff = Date.now() - new Date(lastDate).getTime();
    daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  return {
    username,
    lastTweetDate: lastDate,
    lastTweetText: latest.text.substring(0, 200),
    daysSinceLastTweet: daysSince,
  };
}

async function getRecentTweets(userId: string, limit = 5): Promise<XRecentPost[]> {
  const boundedLimit = Math.max(1, Math.min(5, Math.floor(limit)));
  const { data, error } = await xFetch<XUserTweetsResponse>(
    `/users/${userId}/tweets?max_results=${boundedLimit}&tweet.fields=created_at&exclude=retweets,replies`
  );

  if (error || !data?.data?.length) {
    return [];
  }

  return data.data.map((tweet) => ({
    id: tweet.id,
    createdAt: tweet.created_at ?? null,
    text: tweet.text.replace(/\s+/g, " ").trim().slice(0, 240),
  }));
}

// ---------------------------------------------------------------------------
// 4. Full competitor signal — combines all 3 calls
// ---------------------------------------------------------------------------

/**
 * Get complete X signal for a list of competitor handles.
 * 
 * Cost breakdown for N competitors:
 *   - 1 batch user lookup (all at once)
 *   - N mention count queries
 *   - N last-tweet lookups
 *   Total: 1 + 2N requests
 *   For 3 competitors: 7 requests ≈ $0.15
 */
export async function getCompetitorSignals(
  handles: string[]
): Promise<XCompetitorSignal[]> {
  if (!BEARER_TOKEN || handles.length === 0) return [];

  // Step 1: Batch user lookup (1 request)
  const profiles = await batchUserLookup(handles);

  // Step 2+3: For each competitor, get mentions + last tweet
  const signals: XCompetitorSignal[] = [];

  for (const handle of handles) {
    const profile = profiles.get(handle.toLowerCase()) ?? null;

    // Mention count: search for @handle OR project name
    const mentionStats = await getMentionCount(`@${handle}`);

    // Last tweet date
    let lastActivity: XLastActivity = {
      username: handle,
      lastTweetDate: null,
      lastTweetText: null,
      daysSinceLastTweet: null,
    };

    if (profile) {
      lastActivity = await getLastTweetDate(profile.id, profile.username);
    }

    signals.push({ username: handle, profile, lastActivity, mentionStats });
  }

  return signals;
}

// ---------------------------------------------------------------------------
// 5. Quick liveness check — is this project active on X? 
//    Minimal cost: 1 user lookup + 1 timeline peek = 2 requests
// ---------------------------------------------------------------------------

export async function getCompetitorRecentPosts(
  handles: string[]
): Promise<XCompetitorRecentPosts[]> {
  if (!BEARER_TOKEN || handles.length === 0) return [];

  const profiles = await batchUserLookup(handles);
  const uniqueHandles = Array.from(new Set(handles.map((h) => h.trim()).filter(Boolean)));

  const snapshots = await Promise.all(
    uniqueHandles.map(async (handle) => {
      const profile = profiles.get(handle.toLowerCase()) ?? null;
      if (!profile) {
        return {
          username: handle,
          followers: null,
          posts: [],
        };
      }

      const posts = await getRecentTweets(profile.id, 5);
      return {
        username: profile.username,
        followers: profile.followersCount,
        posts,
      };
    })
  );

  return snapshots;
}

// Minimal cost: 1 user lookup + 1 timeline peek = 2 requests
export async function checkXLiveness(handle: string): Promise<{
  isActive: boolean;
  followers: number;
  daysSincePost: number | null;
  mentionsPerDay: number;
}> {
  const profiles = await batchUserLookup([handle]);
  const profile = profiles.get(handle.toLowerCase());

  if (!profile) {
    return { isActive: false, followers: 0, daysSincePost: null, mentionsPerDay: 0 };
  }

  const lastActivity = await getLastTweetDate(profile.id, profile.username);
  const mentionStats = await getMentionCount(`@${handle}`);

  const daysSince = lastActivity.daysSinceLastTweet;
  const isActive = daysSince !== null && daysSince < 30 && mentionStats.dailyAvg > 0;

  return {
    isActive,
    followers: profile.followersCount,
    daysSincePost: daysSince,
    mentionsPerDay: mentionStats.dailyAvg,
  };
}
