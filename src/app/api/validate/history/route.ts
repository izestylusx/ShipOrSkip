import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/validate/history
// ---------------------------------------------------------------------------
// Returns all validation records for AI evaluation & analysis.
// Supports pagination (?page=1&limit=50) and filtering (?signal=SHIP&category=DEX).
//
// Example uses:
//   - Export all validations for analysis
//   - Filter by signal to see what ideas got SHIP vs HIGH_RISK
//   - Filter by category to see what categories users explore most
//   - Review AI recommendations for quality assurance

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  // Filters
  const signal = searchParams.get("signal"); // SHIP | SHIP_WITH_CAUTION | HIGH_RISK
  const category = searchParams.get("category");
  const mode = searchParams.get("mode"); // ai | fallback

  const where: Record<string, string> = {};
  if (signal) where.signal = signal;
  if (category) where.category = category;
  if (mode) where.analysisMode = mode;

  try {
    const [records, total] = await Promise.all([
      prisma.validationRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.validationRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[ValidationHistory] Query failed:", err);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}
