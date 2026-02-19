/**
 * Pipeline v2 API Client
 * Fetches live data from VPS at 207.148.9.29:4000
 *
 * Falls back to local data/projects.json if API is unreachable.
 */

import type {
  PipelineProject,
  PipelineProjectsResponse,
  PipelineStatsResponse,
} from "@/types/pipeline";

const API_BASE =
  process.env.PIPELINE_API_URL ?? "http://207.148.9.29:4000/api/v1";

const DEFAULT_TIMEOUT_MS = 8000;

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const isDev = process.env.NODE_ENV === "development";
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      // Dev: no cache so count always reflects live DB immediately
      // Prod: revalidate every 10 min, invalidated on-demand via /api/revalidate
      ...(isDev
        ? { cache: "no-store" as const }
        : { next: { revalidate: 600, tags: ["projects"] } }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[pipeline-api] ${path} → HTTP ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[pipeline-api] ${path} → ${(err as Error).message}`);
    return null;
  }
}

/**
 * Fetch all projects (up to `limit`), sorted by survivalScore desc.
 */
export async function fetchProjects(limit = 2000): Promise<PipelineProject[]> {
  const data = await apiFetch<PipelineProjectsResponse>(
    `/projects?limit=${limit}&sort=survivalScore&order=desc`
  );
  return data?.data ?? [];
}

/**
 * Fetch a single project by slug.
 */
export async function fetchProjectBySlug(
  slug: string
): Promise<PipelineProject | null> {
  return apiFetch<PipelineProject>(`/projects/${slug}`);
}

/**
 * Fetch aggregate stats for dashboard.
 */
export async function fetchStats(): Promise<PipelineStatsResponse | null> {
  return apiFetch<PipelineStatsResponse>("/projects/stats");
}
