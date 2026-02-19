// =============================================================================
// Async Validation Job Store
// =============================================================================
// In-memory store for validation jobs. Enables async flow:
//   POST /api/validate   -> start job, return { jobId }
//   GET  /api/validate/status?jobId=xxx -> poll result
//
// Jobs are cleaned up after JOB_TTL_MS (15 minutes).

import type { CategoryResolution } from "@/lib/category-inference";
import type { ProjectData } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStep = "queued" | "intel" | "reddit_intel" | "verdict" | "done";
export type JobStatus = "processing" | "completed" | "failed";

export interface SimilarMatch {
  project: ProjectData;
  relevance: number;
  matchReasons: string[];
}

export interface ValidationJobInput {
  description: string;
  targetUsers: string;
  categoryContext: CategoryResolution;
  similar: SimilarMatch[];
  ecosystemStats: {
    totalProjects: number;
    alive: number;
    zombie: number;
    dead: number;
  };
  trendCategory: string;
  /** When true, skip storing validation to DB (premium private mode) */
  privateMode?: boolean;
}

export interface ValidationJobResult {
  signal: string;
  pmfScore: number;
  similarProjects: unknown[];
  trendAnalysis?: unknown;
  categoryContext: unknown;
  deathPatterns: string;
  biggestRisk: string;
  recommendation: string;
  edgeNeeded: string;
  timingAssessment: string;
  trendInsight: string;
  analysisMode: "ai" | "ai_grok_fallback" | "fallback";
  fallbackReason?: string;
  redditIntel?: unknown;
  ecosystemStats: unknown;
}

export interface ValidationJob {
  id: string;
  status: JobStatus;
  step: JobStep;
  input: ValidationJobInput;
  result: ValidationJobResult | null;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const JOB_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Use globalThis to persist the jobs Map across Next.js hot-reloads in dev mode.
// Without this, each module re-evaluation creates a new empty Map, losing all jobs.
const globalForJobs = globalThis as unknown as {
  __validationJobs?: Map<string, ValidationJob>;
};
const jobs = globalForJobs.__validationJobs ?? new Map<string, ValidationJob>();
globalForJobs.__validationJobs = jobs;

let cleanupScheduled = false;

function scheduleCleanup(): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setTimeout(() => {
    const now = Date.now();
    jobs.forEach((job, id) => {
      if (now - job.createdAt > JOB_TTL_MS) {
        jobs.delete(id);
      }
    });
    cleanupScheduled = false;
    if (jobs.size > 0) scheduleCleanup();
  }, 60_000);
}

export function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `val_${timestamp}_${random}`;
}

export function createJob(input: ValidationJobInput): ValidationJob {
  const job: ValidationJob = {
    id: generateJobId(),
    status: "processing",
    step: "queued",
    input,
    result: null,
    error: null,
    createdAt: Date.now(),
    completedAt: null,
  };

  jobs.set(job.id, job);
  scheduleCleanup();
  return job;
}

export function getJob(id: string): ValidationJob | undefined {
  return jobs.get(id);
}

export function updateJobStep(id: string, step: JobStep): void {
  const job = jobs.get(id);
  if (job) job.step = step;
}

export function completeJob(id: string, result: ValidationJobResult): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "completed";
  job.step = "done";
  job.result = result;
  job.completedAt = Date.now();
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "failed";
  job.error = error;
  job.completedAt = Date.now();
}
