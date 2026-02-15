import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, category, targetUsers } = body;

    if (!description || !category) {
      return NextResponse.json(
        { error: "Description and category are required" },
        { status: 400 }
      );
    }

    // TODO: Implement Gemini AI validation
    return NextResponse.json({
      signal: "SHIP_WITH_CAUTION",
      pmfScore: 65,
      similarProjects: [],
      deathPatterns: "Placeholder — Gemini integration pending",
      biggestRisk: "Placeholder",
      recommendation: "Placeholder",
      edgeNeeded: "Placeholder",
      timingAssessment: "Placeholder",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
