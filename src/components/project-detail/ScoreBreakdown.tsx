import { ProjectData } from "@/types";
import { scoreColor, barColor } from "@/lib/score-color";

interface ScoreBreakdownProps {
  factors: ProjectData["factors"];
  category?: string; // used to contextualise labels (e.g. Gaming vs DeFi)
}

type FactorKey = keyof ProjectData["factors"];

interface FactorDef {
  key: FactorKey;
  label: string;
  description: string;
  defiLabel?: string;    // override label for DeFi projects
  defiDesc?: string;
}

const FACTOR_DEFINITIONS: FactorDef[] = [
  // ── Pipeline v2 factors ──────────────────────────────────────────────────
  { key: "userActivity",    label: "User Activity",      description: "Weekly active users on-chain" },
  { key: "userGrowth",      label: "User Growth",        description: "Week-over-week user growth %" },
  { key: "txActivity",      label: "TX Activity",        description: "On-chain transaction volume" },
  {
    key: "tvlHealth",
    label: "Liquidity",
    description: "DEX liquidity available for the token",
    defiLabel: "TVL Health",
    defiDesc: "Total Value Locked retention vs peak",
  },
  { key: "priceMomentum",   label: "Price Momentum",     description: "Token price trend (24h / 30d)" },
  { key: "tradingHealth",   label: "Trading Health",     description: "Volume, liquidity & vol/mcap ratio" },
  { key: "holderStrength",  label: "Holder Strength",    description: "Token holder distribution quality" },
  { key: "marketSentiment", label: "Market Sentiment",   description: "Overall market sentiment signal" },
  { key: "contractTrust",   label: "Contract Trust",     description: "On-chain verification & holder safety" },
  { key: "categoryHealth",  label: "Category Health",    description: "How this category performs vs others" },
  { key: "dappBayRank",     label: "DappBay Rank",       description: "Position in BNB Chain official directory" },
  { key: "marketCap",       label: "Market Cap",         description: "Market capitalisation signal" },
  { key: "twitterActivity", label: "Twitter Activity",   description: "Social media recency & follower depth" },
  // ── Legacy aliases (old pipeline keys, fallback display) ─────────────────
  { key: "txTrend",           label: "TX Activity",          description: "On-chain transaction volume" },
  { key: "communityEngagement", label: "Twitter Activity",   description: "Social media recency & activity" },
  { key: "tvlRetention",      label: "TVL Health",           description: "TVL retention vs peak" },
  { key: "tokenQuality",      label: "Trading Health",       description: "Volume & liquidity quality" },
  { key: "marketRelevance",   label: "Market Cap Signal",    description: "Market capitalisation signal" },
  { key: "contractActivity",  label: "Contract Trust",       description: "On-chain verification quality" },
  { key: "holderTrend",       label: "Holder Strength",      description: "Token holder distribution" },
  { key: "ecosystemIntegration", label: "Ecosystem",         description: "BSC ecosystem integration" },
  { key: "priceTrend",        label: "Price Trend",          description: "Token price momentum (7d, 30d)" },
  { key: "whaleConviction",   label: "Whale Conviction",     description: "Smart money positioning" },
  { key: "githubActivity",    label: "Development",          description: "GitHub commit activity" },
  { key: "holderDistribution", label: "Holder Distribution", description: "Token concentration profile" },
  { key: "tradingVolume",     label: "Trading Volume",       description: "24h DEX trading volume" },
  { key: "liquidityDepth",    label: "Liquidity Depth",      description: "DEX liquidity pool depth" },
];

// Keys that should not both show (v2 key takes precedence over legacy alias)
const LEGACY_SUPERSEDED_BY: Partial<Record<FactorKey, FactorKey>> = {
  txTrend: "txActivity",
  communityEngagement: "twitterActivity",
  tvlRetention: "tvlHealth",
  tokenQuality: "tradingHealth",
  marketRelevance: "marketCap",
  contractActivity: "contractTrust",
  holderTrend: "holderStrength",
};

const DEFI_CATEGORIES = ["DEX", "Lending", "Yield", "Bridge", "Launchpad", "DeFi"];

export default function ScoreBreakdown({ factors, category }: ScoreBreakdownProps) {
  const isDefi = DEFI_CATEGORIES.some((c) => category?.includes(c));

  // Collect all present v2 keys to skip their legacy duplicates
  const presentV2Keys = new Set(
    Object.entries(LEGACY_SUPERSEDED_BY)
      .map(([, v2key]) => v2key)
      .filter((k) => factors[k] !== undefined && factors[k] !== null)
  );

  const activeFactors = FACTOR_DEFINITIONS.filter((def) => {
    const value = factors[def.key];
    if (value === undefined || value === null) return false;
    // Skip legacy key if its v2 counterpart is present
    const v2Key = LEGACY_SUPERSEDED_BY[def.key];
    if (v2Key && presentV2Keys.has(v2Key)) return false;
    return true;
  });

  if (!activeFactors.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-warm-900 mb-4">Score Breakdown</h2>
      <div className="space-y-3">
        {activeFactors.map((factor) => {
          const value = factors[factor.key] ?? 0;
          const label = isDefi && factor.defiLabel ? factor.defiLabel : factor.label;
          const desc  = isDefi && factor.defiDesc  ? factor.defiDesc  : factor.description;
          return (
            <div key={factor.key}>
              <div className="flex items-end justify-between mb-1 gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-warm-700">{label}</span>
                  <span className="text-xs text-warm-500 ml-2">{desc}</span>
                </div>
                <span className={`text-sm font-mono font-bold flex-shrink-0 ${scoreColor(value)}`}>
                  {value}
                </span>
              </div>
              <div className="h-2 bg-warm-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

