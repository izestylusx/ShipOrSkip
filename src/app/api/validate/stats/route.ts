import { NextResponse } from "next/server";
import { getValidationAggregateStats } from "@/lib/validation-store";
import { getEcosystemIntelligence } from "@/lib/ecosystem-stats";

// ---------------------------------------------------------------------------
// GET /api/validate/stats
// ---------------------------------------------------------------------------
// Returns aggregate validation stats + ecosystem intelligence.
// Public endpoint, no auth needed. Used by landing page & validation UI.

export async function GET() {
  const [validationStats, ecosystem] = await Promise.all([
    getValidationAggregateStats(),
    getEcosystemIntelligence(),
  ]);

  return NextResponse.json({
    validations: validationStats,
    ecosystem: {
      totalProjects: ecosystem.totalProjects,
      survivalRate: ecosystem.overallSurvivalRate,
      categorySurvival: ecosystem.categorySurvival,
      topDeathPatterns: ecosystem.topDeathPatterns,
    },
  });
}
