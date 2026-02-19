import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation endpoint.
 * Called by Pipeline VPS B after new projects are ingested.
 *
 * Usage:
 *   POST /api/revalidate
 *   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 *
 * Or from curl on VPS B:
 *   curl -X POST https://yourdomain.com/api/revalidate \
 *     -H "x-revalidate-secret: $REVALIDATE_SECRET"
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET not configured on server" },
      { status: 500 }
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("projects");

  return NextResponse.json({
    revalidated: true,
    tag: "projects",
    timestamp: new Date().toISOString(),
  });
}
