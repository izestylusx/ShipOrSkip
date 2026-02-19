import { CategoryTag, SignalBadge, StatusBadge } from "@/components/Badges";
import EcosystemIntelPanel from "@/components/validator/EcosystemIntelPanel";
import FeedbackRow from "@/components/validator/FeedbackRow";
import PostResultActions from "@/components/validator/PostResultActions";
import RedditIntelPanel from "@/components/validator/RedditIntelPanel";
import TrendAnalysisPanel from "@/components/validator/TrendAnalysisPanel";
import { ValidationResultData } from "@/components/validator/types";

interface ValidationResultProps {
  result: ValidationResultData;
  sharing: boolean;
  onShare: () => void;
  onReset: () => void;
  onCloseMobile?: () => void;
  onSubmitOnchain?: () => void;
  submittingOnchain?: boolean;
  onchainTxHash?: string | null;
  onchainError?: string;
  onExportMarkdown?: () => void;
  onExportPng?: () => void;
  exportingMarkdown?: boolean;
  exportingPng?: boolean;
  exportTargetId?: string;
}

const SCOREBOARD_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xd6a229D8cFbde4be596dd9Cd53d1b3E8bD272432";

const SCOREBOARD_PROOF_TX =
  process.env.NEXT_PUBLIC_SCOREBOARD_PROOF_TX || "";

const SCOREBOARD_EXPLORER_BASE = (
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || "https://bscscan.com"
).replace(/\/+$/, "");

const ANALYSIS_CARD_STYLES: Record<string, { border: string; dot: string; label: string; bg: string }> = {
  "Death Patterns": { border: "border-l-skip-400", dot: "bg-skip-400", label: "text-skip-600", bg: "hover:bg-skip-50/40" },
  "Biggest Risk": { border: "border-l-wait-500", dot: "bg-wait-500", label: "text-wait-700", bg: "hover:bg-wait-50/40" },
  "Recommendation": { border: "border-l-ship-400", dot: "bg-ship-400", label: "text-ship-600", bg: "hover:bg-ship-50/40" },
  "Edge Needed": { border: "border-l-data-400", dot: "bg-data-400", label: "text-data-600", bg: "hover:bg-data-50/40" },
  "Timing Assessment": { border: "border-l-warm-500", dot: "bg-warm-500", label: "text-warm-700", bg: "hover:bg-warm-50/40" },
};

/* ---- Fix 7: Improved AnalysisCard with hover + better typography ---- */
function AnalysisCard({ title, content, span2 }: { title: string; content: string; span2?: boolean }) {
  if (!content || content === "Pending AI analysis") return null;
  const style = ANALYSIS_CARD_STYLES[title] ?? {
    border: "border-l-warm-300", dot: "bg-warm-400", label: "text-warm-600", bg: "hover:bg-warm-50/40",
  };
  return (
    <div
      className={`p-4 bg-white border border-warm-200 border-l-4 ${style.border} rounded-lg flex flex-col gap-2 transition-all duration-200 ${style.bg} hover:shadow-sm ${span2 ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        {/* Fix 6: Bumped from text-[10px] → text-xs */}
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${style.label}`}>{title}</h4>
      </div>
      <p className="text-sm text-warm-700 leading-relaxed">{content}</p>
    </div>
  );
}

function formatMcap(value: number | null) {
  if (!value) return "N/A";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/* ---- Fix 4: Truncate blockchain addresses ---- */
function truncateAddress(addr: string) {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ValidationResult({
  result,
  sharing,
  onShare,
  onReset,
  onCloseMobile,
  onSubmitOnchain,
  submittingOnchain,
  onchainTxHash,
  onchainError,
  onExportMarkdown,
  onExportPng,
  exportingMarkdown,
  exportingPng,
  exportTargetId,
}: ValidationResultProps) {
  const contractExplorerUrl = `${SCOREBOARD_EXPLORER_BASE}/address/${SCOREBOARD_ADDRESS}`;
  const batchProofExplorerUrl = `${SCOREBOARD_EXPLORER_BASE}/tx/${SCOREBOARD_PROOF_TX}`;
  const userTxExplorerUrl = onchainTxHash
    ? `${SCOREBOARD_EXPLORER_BASE}/tx/${onchainTxHash}`
    : null;

  return (
    <div id={exportTargetId} className="space-y-5 animate-slide-up">
      {onCloseMobile && (
        <div className="md:hidden flex justify-end">
          <button
            onClick={onCloseMobile}
            className="px-3 py-2 text-xs rounded-md border border-warm-300 text-warm-700"
          >
            Close
          </button>
        </div>
      )}

      {/* ============================================================
          ROW 1 — Score Card (left) + Trend Analysis (right)
          Fix 1: Score card now col-span-3, with category scope pulled
          tighter. Trend gets col-span-9 for more breathing room.
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Score Card — compact & vertically aligned */}
        <div className="lg:col-span-3">
          <div className="p-5 bg-white border border-warm-200 rounded-xl flex flex-col gap-4 h-full">
            {/* Signal + Score inline */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0 w-16 h-16">
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-warm-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className={result.pmfScore >= 70 ? "text-ship-500" : result.pmfScore >= 40 ? "text-wait-500" : "text-skip-500"}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${result.pmfScore}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-warm-900 font-mono">
                  {result.pmfScore}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <SignalBadge signal={result.signal} />
                {/* Fix 6: from text-[11px] → text-xs */}
                <p className="text-xs text-warm-500">PMF Score</p>
              </div>
            </div>

            {result.analysisMode === "fallback" && (
              <p className="text-xs text-wait-700 bg-wait-50 border border-wait-200 rounded-lg px-3 py-2">
                AI response not available in time. Showing data-driven fallback.
              </p>
            )}

            {result.categoryContext && (
              <div className="text-xs border-t border-warm-200 pt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {/* Fix 6: from text-[10px] → text-xs */}
                  <span className="text-warm-500 text-xs uppercase tracking-wide font-medium">Scope</span>
                  {result.categoryContext.categories.map((item) => (
                    <span
                      key={item.category}
                      className="bg-warm-200 px-1.5 py-0.5 rounded text-warm-800 font-mono text-xs"
                    >
                      {item.category}{" "}
                      <span className="text-warm-500">{Math.round(item.weight * 100)}%</span>
                    </span>
                  ))}
                </div>
                {/* Fix 6: from text-[10px] → text-xs */}
                <p className="text-xs text-warm-500">
                  Yield{" "}
                  <span className="text-warm-700 font-medium">
                    {result.categoryContext.source === "auto_inferred" ? "Auto-inferred" : "Manual"}
                  </span>{" "}
                  · Primary:{" "}
                  <span className="text-warm-800 font-medium">{result.categoryContext.primaryCategory}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trend Analysis — takes remaining cols */}
        <div className="lg:col-span-9">
          <TrendAnalysisPanel trend={result.trendAnalysis} />
        </div>
      </div>

      {/* ============================================================
          ROW 2 — Analysis Insight Cards
          Fix 2: Changed from 3-col → 2-col grid.
          Last card spans 2 cols when odd count, eliminating the
          awkward empty slot.
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnalysisCard title="Death Patterns" content={result.deathPatterns} />
        <AnalysisCard title="Biggest Risk" content={result.biggestRisk} />
        <AnalysisCard title="Recommendation" content={result.recommendation} />
        <AnalysisCard title="Edge Needed" content={result.edgeNeeded} />
        <AnalysisCard title="Timing Assessment" content={result.timingAssessment} span2 />
      </div>

      {/* ============================================================
          ROW 3 — Ecosystem + Similar Projects + Reddit
          Fix 3: Unequal widths — Ecosystem compact (3),
          Similar (4), Reddit gets most space (5).
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3">
          <EcosystemIntelPanel
            ecosystem={result.ecosystemIntelligence}
            community={result.communityStats}
          />
        </div>

        {result.similarProjects.length > 0 && (
          <div className="lg:col-span-4">
            <div className="p-4 bg-white border border-warm-200 rounded-xl h-full">
              <h3 className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-3">
                Similar Projects in BNB Ecosystem
              </h3>
              <div className="space-y-0.5">
                {result.similarProjects.map((project) => (
                  <a
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-warm-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-mono text-xs font-bold text-warm-500 w-6 flex-shrink-0">{project.score}</span>
                      <span className="text-sm text-warm-900 group-hover:text-ship-600 transition-colors truncate">{project.name}</span>
                      <StatusBadge status={project.status} />
                      <CategoryTag category={project.category} />
                    </div>
                    <span className="text-warm-500 text-xs font-mono flex-shrink-0 ml-2">{formatMcap(project.marketCap)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={result.similarProjects.length > 0 ? "lg:col-span-5" : "lg:col-span-9"}>
          <RedditIntelPanel redditIntel={result.redditIntel} />
        </div>
      </div>

      {/* ============================================================
          Onchain Proof — Fix 4: Truncated addresses, inline layout
          ============================================================ */}
      <div className="p-4 bg-white border border-warm-200 rounded-xl">
        <h3 className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-2">
          Onchain Proof
        </h3>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-warm-600">
          <p className="flex items-center gap-1.5">
            <span className="text-warm-500">Contract:</span>
            <a
              href={contractExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-data-600 hover:text-data-500 font-mono hover:underline"
              title={SCOREBOARD_ADDRESS}
            >
              {truncateAddress(SCOREBOARD_ADDRESS)}
            </a>
          </p>
          <span className="hidden sm:inline text-warm-300">|</span>
          <p className="flex items-center gap-1.5">
            <span className="text-warm-500">Batch proof:</span>
            <a
              href={batchProofExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-data-600 hover:text-data-500 font-mono hover:underline"
              title={SCOREBOARD_PROOF_TX}
            >
              {truncateAddress(SCOREBOARD_PROOF_TX)}
            </a>
          </p>
          {onchainTxHash && (
            <>
              <span className="hidden sm:inline text-warm-300">|</span>
              <p className="flex items-center gap-1.5">
                <span className="text-warm-500">Your tx:</span>
                <a
                  href={userTxExplorerUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ship-600 hover:text-ship-500 font-mono hover:underline"
                  title={onchainTxHash}
                >
                  {truncateAddress(onchainTxHash)}
                </a>
              </p>
            </>
          )}
        </div>
        {onchainError && (
          <p className="text-xs text-skip-700 mt-2">{onchainError}</p>
        )}
      </div>

      {/* ---- Actions + Feedback ---- */}
      <PostResultActions
        onReset={onReset}
        onShare={onShare}
        sharing={sharing}
        onSubmitOnchain={onSubmitOnchain}
        submittingOnchain={submittingOnchain}
        onchainTxHash={onchainTxHash}
        txExplorerUrl={userTxExplorerUrl}
        onExportMarkdown={onExportMarkdown}
        onExportPng={onExportPng}
        exportingMarkdown={exportingMarkdown}
        exportingPng={exportingPng}
      />
      <FeedbackRow />
    </div>
  );
}
