/**
 * PipelineMetrics — displays pipeline v2 specific data:
 * - User activity (daily/weekly/monthly users & txns)
 * - DappBay rank
 * - Twitter last post + followers
 * - AI analysis summary (alive or post-mortem)
 */

import type { PipelineProject } from "@/types/pipeline";

interface Props {
  project: PipelineProject;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function growthColor(pct: number | null | undefined): string {
  if (!pct) return "text-warm-600";
  if (pct > 0) return "text-ship-700";
  if (pct < 0) return "text-skip-700";
  return "text-warm-600";
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-warm-300 rounded-lg p-3">
      <p className="text-[11px] text-warm-500 font-mono">{label}</p>
      <p className="text-sm font-semibold text-warm-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PipelineMetrics({ project }: Props) {
  const hasUserData =
    project.weeklyUsers ||
    project.weeklyTxns ||
    project.dailyUsers ||
    project.monthlyUsers;

  const hasToken =
    project.priceUsd !== null ||
    project.marketCapUsd !== null ||
    project.liquidityUsd !== null;

  const summary =
    project.aiAnalysis?.aliveSummary ?? null;
  const postMortem = project.aiAnalysis?.postMortem ?? null;

  return (
    <>
      {/* ── User Activity ─────────────────────────────────────── */}
      {hasUserData && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-3">Activity Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              label="Weekly Users"
              value={fmt(project.weeklyUsers)}
              sub={
                project.weeklyUsersChange !== null
                  ? `${project.weeklyUsersChange > 0 ? "+" : ""}${project.weeklyUsersChange.toFixed(1)}% WoW`
                  : undefined
              }
            />
            <StatBox label="Monthly Users" value={fmt(project.monthlyUsers)} />
            <StatBox label="Weekly Txns" value={fmt(project.weeklyTxns)} />
            <StatBox label="Monthly Txns" value={fmt(project.monthlyTxns)} />
          </div>

          {project.weeklyUsersChange !== null && (
            <p className={`text-xs font-mono mt-2 ${growthColor(project.weeklyUsersChange)}`}>
              {project.weeklyUsersChange > 0 ? "↑" : "↓"}{" "}
              {Math.abs(project.weeklyUsersChange).toFixed(1)}% weekly user growth
            </p>
          )}
        </section>
      )}

      {/* ── DappBay + Twitter ────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-warm-900 mb-3">Platform Presence</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {project.dappbayRank && (
            <StatBox
              label="DappBay Rank"
              value={`#${project.dappbayRank}`}
              sub="BNB Chain directory"
            />
          )}
          {project.twitterFollowers !== null && (
            <StatBox
              label="Twitter Followers"
              value={fmt(project.twitterFollowers)}
              sub={
                project.twitterDaysSincePost !== null
                  ? `Last post ${project.twitterDaysSincePost}d ago`
                  : undefined
              }
            />
          )}
          {project.holderCount !== null && (
            <StatBox label="Token Holders" value={fmt(project.holderCount)} />
          )}
          {project.top10HolderPct !== null && (
            <StatBox
              label="Top 10 Holders"
              value={`${project.top10HolderPct.toFixed(1)}%`}
              sub="of supply"
            />
          )}
        </div>
      </section>

      {/* ── Token Metrics (if has token data) ──────────────── */}
      {hasToken && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-3">Market Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {project.priceUsd !== null && (
              <StatBox
                label="Price"
                value={`$${project.priceUsd < 0.001 ? project.priceUsd.toExponential(2) : project.priceUsd.toFixed(4)}`}
                sub={
                  project.priceChange24h !== null
                    ? `${project.priceChange24h > 0 ? "+" : ""}${project.priceChange24h.toFixed(1)}% 24h`
                    : undefined
                }
              />
            )}
            {project.marketCapUsd !== null && (
              <StatBox label="Market Cap" value={`$${fmt(project.marketCapUsd)}`} />
            )}
            {project.volume24h !== null && (
              <StatBox label="24h Volume" value={`$${fmt(project.volume24h)}`} />
            )}
            {project.liquidityUsd !== null && (
              <StatBox label="Liquidity" value={`$${fmt(project.liquidityUsd)}`} />
            )}
          </div>
        </section>
      )}

      {/* ── Twitter last post ────────────────────────────────── */}
      {project.twitterLastPost && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Latest Tweet</h2>
          <blockquote className="bg-white border border-warm-300 rounded-lg p-4 text-sm text-warm-700 italic leading-relaxed line-clamp-4">
            &ldquo;{project.twitterLastPost}&rdquo;
          </blockquote>
          {project.twitterLastPostAt && (
            <p className="text-xs text-warm-500 mt-1">
              {new Date(project.twitterLastPostAt).toLocaleDateString()}
              {project.twitterHandle && (
                <> ·{" "}
                  <a
                    href={`https://x.com/${project.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-data-600 hover:underline"
                  >
                    @{project.twitterHandle}
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      )}

      {/* ── AI Analysis ────────────────────────────────────── */}
      {(summary || postMortem) && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-3">AI Analysis</h2>
          {summary && (
            <div className="space-y-3">
              <p className="text-sm text-warm-700 leading-relaxed">{summary.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-ship-50 border border-ship-200 rounded-lg p-3">
                  <p className="text-[11px] text-ship-700 font-semibold uppercase tracking-wide mb-1">Key Strength</p>
                  <p className="text-sm text-warm-800">{summary.keyStrength}</p>
                </div>
                <div className="bg-skip-50 border border-skip-200 rounded-lg p-3">
                  <p className="text-[11px] text-skip-700 font-semibold uppercase tracking-wide mb-1">Primary Risk</p>
                  <p className="text-sm text-warm-800">{summary.primaryRisk}</p>
                </div>
                <div className="bg-wait-50 border border-wait-200 rounded-lg p-3 sm:col-span-2">
                  <p className="text-[11px] text-wait-700 font-semibold uppercase tracking-wide mb-1">Builder Takeaway</p>
                  <p className="text-sm text-warm-800">{summary.builderTakeaway}</p>
                </div>
              </div>
              {project.aiAnalysis?.model && (
                <p className="text-[10px] text-warm-400 font-mono">
                  Model: {project.aiAnalysis.model} ·{" "}
                  {project.aiAnalysis.analyzedAt
                    ? new Date(project.aiAnalysis.analyzedAt).toLocaleString()
                    : ""}
                </p>
              )}
            </div>
          )}
          {postMortem && !summary && (
            <div className="space-y-3">
              <div className="bg-skip-50 border border-skip-200 rounded-lg p-4">
                <p className="text-[11px] text-skip-700 font-semibold uppercase tracking-wide mb-1">What happened</p>
                <p className="text-sm text-warm-800">{postMortem.whatHappened}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-warm-300 rounded-lg p-3">
                  <p className="text-[11px] text-warm-600 font-semibold uppercase tracking-wide mb-1">Root Cause</p>
                  <p className="text-sm text-warm-800">{postMortem.rootCause}</p>
                </div>
                <div className="bg-white border border-warm-300 rounded-lg p-3">
                  <p className="text-[11px] text-warm-600 font-semibold uppercase tracking-wide mb-1">Death Pattern</p>
                  <p className="text-sm text-warm-800">{postMortem.deathPattern}</p>
                </div>
              </div>
              <div className="bg-wait-50 border border-wait-200 rounded-lg p-3">
                <p className="text-[11px] text-wait-700 font-semibold uppercase tracking-wide mb-1">Lesson for Builders</p>
                <p className="text-sm text-warm-800">{postMortem.lessonForBuilders}</p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
