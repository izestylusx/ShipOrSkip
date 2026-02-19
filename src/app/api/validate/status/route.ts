import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/validation-jobs";

// ---------------------------------------------------------------------------
// GET /api/validate/status?jobId=xxx
// ---------------------------------------------------------------------------
// Poll for async validation job result.
// Returns:
//   200 { status: "completed", result: {...} }      -> done, full result
//   200 { status: "processing", step: "intel"|"verdict" } -> still working
//   200 { status: "failed", error: "..." }          -> job failed
//   404 { error: "Job not found" }                  -> invalid/expired jobId

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId parameter" },
      { status: 400 }
    );
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found or expired (jobs expire after 15 minutes)" },
      { status: 404 }
    );
  }

  if (job.status === "completed" && job.result) {
    return NextResponse.json({
      status: "completed",
      result: job.result,
      duration: job.completedAt ? job.completedAt - job.createdAt : null,
    });
  }

  if (job.status === "failed") {
    return NextResponse.json({
      status: "failed",
      error: job.error ?? "Unknown error",
      duration: job.completedAt ? job.completedAt - job.createdAt : null,
    });
  }

  // Still processing
  return NextResponse.json({
    status: "processing",
    step: job.step,
    elapsed: Date.now() - job.createdAt,
  });
}
