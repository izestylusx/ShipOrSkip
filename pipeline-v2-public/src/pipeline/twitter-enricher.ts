// =============================================================================
// ShipOrSkip Pipeline — Phase 2.5: Twitter Activity Enricher
// =============================================================================
// Fetches last-post date + follower counts for all projects with Twitter handles.
// Uses Grok x_search batch (primary) or Twitter API v2 (fallback).
// =============================================================================

import { createLogger } from "../shared/logger";
import { fetchTwitterActivityBatch } from "../sources/twitter";
import type { EnrichedProject } from "../shared/types";

const logger = createLogger("twitter-enricher");

export interface TwitterEnricherResult {
  projects: EnrichedProject[];
  stats: { found: number; abandoned: number; noHandle: number };
  durationMs: number;
}

/**
 * Phase 2.5: Enrich the `social` field of each project with Twitter activity.
 */
export async function enrichTwitterActivity(
  projects: EnrichedProject[]
): Promise<TwitterEnricherResult> {
  const start = Date.now();
  const stats = { found: 0, abandoned: 0, noHandle: 0 };

  // Build handle list — we infer handles from project name if not available
  const withHandle = projects
    .map((p) => {
      // Try to derive a handle from the project name; for a real deployment
      // this would come from CoinGecko links.twitter_screen_name.
      const handle = deriveHandle(p.name);
      return handle ? { slug: p.coingeckoId, handle, name: p.name } : null;
    })
    .filter(Boolean) as { slug: string; handle: string; name: string }[];

  stats.noHandle = projects.length - withHandle.length;

  if (withHandle.length === 0) {
    logger.info("Phase 2.5: No projects with handles found — skipping Twitter enrichment");
    return { projects, stats, durationMs: Date.now() - start };
  }

  logger.info(
    `Phase 2.5: Fetching Twitter activity for ${withHandle.length} projects`
  );

  const results = await fetchTwitterActivityBatch(withHandle);

  const enriched = projects.map((project) => {
    const result = results.get(project.coingeckoId);
    if (!result) return project;

    const daysSince = result.daysSinceLastPost;
    if (daysSince !== null && daysSince < 30) stats.found++;
    else if (result.accountExists) stats.abandoned++;

    return {
      ...project,
      social: {
        ...project.social,
        twitterFollowers: result.followers,
        // recentTweetCount: proxy via daysSinceLastPost
        recentTweetCount: daysSince !== null && daysSince <= 7 ? 1 : 0,
        grokSnippets: result.lastPost ? [result.lastPost] : [],
      },
      socialEnriched: true,
    };
  });

  logger.info(
    `Phase 2.5 complete: ${stats.found} active, ${stats.abandoned} abandoned, ${stats.noHandle} no handle`
  );

  return { projects: enriched, stats, durationMs: Date.now() - start };
}

/**
 * Attempt to derive a Twitter handle from a project name.
 * Strips spaces and special characters.
 * In production, CoinGecko provides links.twitter_screen_name directly.
 */
function deriveHandle(name: string): string | null {
  const cleaned = name.replace(/[^A-Za-z0-9_]/g, "").slice(0, 15);
  return cleaned.length >= 2 ? cleaned : null;
}
