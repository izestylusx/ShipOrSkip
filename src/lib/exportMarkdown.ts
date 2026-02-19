import { ValidationResultData } from "@/components/validator/types";

interface ExportMarkdownParams {
  description: string;
  result: ValidationResultData;
  onchainTxHash: string;
  explorerTxBaseUrl: string;
  fileName?: string;
}

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function safeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "analysis";
}

function toBulletList(items: string[]): string {
  if (!items.length) return "- N/A";
  return items.map((item) => `- ${item}`).join("\n");
}

function downloadText(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildValidationMarkdown({
  description,
  result,
  onchainTxHash,
  explorerTxBaseUrl,
}: ExportMarkdownParams): string {
  const txBase = explorerTxBaseUrl.replace(/\/+$/, "");
  const txUrl = `${txBase}/${onchainTxHash}`;
  const generatedAt = new Date().toISOString();

  const similarProjects = result.similarProjects.length
    ? result.similarProjects
      .map(
        (project) =>
          `| ${project.name} | ${project.category} | ${project.status} | ${project.score} |`
      )
      .join("\n")
    : "| N/A | N/A | N/A | N/A |";

  const categoryContext = result.categoryContext
    ? result.categoryContext.categories
      .map((item) => `- ${item.category}: ${toPercent(item.weight)}`)
      .join("\n")
    : "- N/A";

  const trend = result.trendAnalysis;
  const ecosystem = result.ecosystemIntelligence;
  const community = result.communityStats;
  const reddit = result.redditIntel;

  return [
    "# ShipOrSkip Validation Report",
    "",
    `- Generated at: ${generatedAt}`,
    `- Signal: ${result.signal}`,
    `- PMF Score: ${result.pmfScore}/100`,
    "",
    "## Idea",
    "",
    description,
    "",
    "## Core Analysis",
    "",
    `- Death Patterns: ${result.deathPatterns}`,
    `- Biggest Risk: ${result.biggestRisk}`,
    `- Recommendation: ${result.recommendation}`,
    `- Edge Needed: ${result.edgeNeeded}`,
    `- Timing Assessment: ${result.timingAssessment}`,
    "",
    "## Category Context",
    "",
    categoryContext,
    "",
    "## Similar Projects",
    "",
    "| Project | Category | Status | Score |",
    "|---|---|---|---|",
    similarProjects,
    "",
    "## Trend Analysis",
    "",
    trend
      ? [
        `- Category Trend: ${trend.categoryTrend}`,
        `- Trend Score: ${trend.trendScore}`,
        `- Buzz Level: ${trend.buzzLevel}`,
        `- Narrative: ${trend.narrative}`,
        "- Rising Keywords:",
        toBulletList(trend.risingKeywords),
        "- Declining Keywords:",
        toBulletList(trend.decliningKeywords),
        `- Timing Verdict: ${trend.timingVerdict}`,
      ].join("\n")
      : "- N/A",
    "",
    "## Ecosystem Intelligence",
    "",
    ecosystem
      ? [
        `- Overall Survival Rate: ${ecosystem.overallSurvivalRate}%`,
        ecosystem.categorySurvival
          ? `- Category Survival: ${ecosystem.categorySurvival.category} (${ecosystem.categorySurvival.survivalRate}%)`
          : "- Category Survival: N/A",
        "- Top Death Patterns:",
        toBulletList(
          ecosystem.topDeathPatterns.map(
            (item) => `${item.pattern} (${item.count}, ${item.percentage}%)`
          )
        ),
      ].join("\n")
      : "- N/A",
    "",
    "## Community Stats",
    "",
    community
      ? [
        `- Total Validations: ${community.totalValidations}`,
        `- Similar Idea Count: ${community.similarIdeaCount}`,
        `- Average PMF Score: ${community.avgPmfScore}`,
      ].join("\n")
      : "- N/A",
    "",
    "## Reddit Intel",
    "",
    reddit
      ? [
        `- Community Buzz: ${reddit.communityBuzz}`,
        "- Key Insights:",
        toBulletList(reddit.keyInsights),
      ].join("\n")
      : "- N/A",
    "",
    "---",
    "Onchain Proof",
    `- Transaction Hash: ${onchainTxHash}`,
    `- Explorer URL: ${txUrl}`,
  ].join("\n");
}

export function exportValidationMarkdown(params: ExportMarkdownParams): void {
  const content = buildValidationMarkdown(params);
  const baseName = safeName(params.description);
  const fileName = params.fileName ?? `ship-or-skip-${baseName}.md`;
  downloadText(content, fileName);
}
