interface PostResultActionsProps {
  onReset: () => void;
  onShare: () => void;
  sharing: boolean;
  onSubmitOnchain?: () => void;
  submittingOnchain?: boolean;
  onchainTxHash?: string | null;
  txExplorerUrl?: string | null;
  onExportMarkdown?: () => void;
  onExportPng?: () => void;
  exportingMarkdown?: boolean;
  exportingPng?: boolean;
}

export default function PostResultActions({
  onReset,
  onShare,
  sharing,
  onSubmitOnchain,
  submittingOnchain,
  onchainTxHash,
  txExplorerUrl,
  onExportMarkdown,
  onExportPng,
  exportingMarkdown,
  exportingPng,
}: PostResultActionsProps) {
  const exportUnlocked = Boolean(onchainTxHash);

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          exportUnlocked
            ? "bg-ship-50 border-ship-200 text-ship-800"
            : "bg-wait-50 border-wait-200 text-wait-800"
        }`}
      >
        {exportUnlocked ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ship-600 text-white">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-medium">Exports unlocked after onchain confirmation.</span>
            {txExplorerUrl && (
              <a
                href={txExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-ship-700 underline hover:text-ship-600"
                title={onchainTxHash ?? undefined}
              >
                View BscScan proof
              </a>
            )}
          </div>
        ) : (
          <p>Register onchain (~$0.01 BNB) to make your analysis immutable and unlock downloads.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onSubmitOnchain && (
          <button
            type="button"
            onClick={onSubmitOnchain}
            disabled={submittingOnchain || exportUnlocked}
            className="px-5 py-2.5 bg-data-600 hover:bg-data-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm shadow-sm"
          >
            {submittingOnchain
              ? "Submitting..."
              : exportUnlocked
                ? "Registered"
                : "Register Onchain"}
          </button>
        )}

        <button
          type="button"
          onClick={onExportMarkdown}
          disabled={!exportUnlocked || exportingMarkdown}
          className="px-4 py-2.5 border border-warm-300 hover:border-warm-400 text-warm-700 hover:text-warm-900 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
        >
          {!exportUnlocked
            ? "Locked Export .md"
            : exportingMarkdown
              ? "Exporting .md..."
              : "Export .md"}
        </button>

        <button
          type="button"
          onClick={onExportPng}
          disabled={!exportUnlocked || exportingPng}
          className="px-4 py-2.5 border border-warm-300 hover:border-warm-400 text-warm-700 hover:text-warm-900 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
        >
          {!exportUnlocked
            ? "Locked Export .png"
            : exportingPng
              ? "Exporting .png..."
              : "Export .png"}
        </button>

        <button
          type="button"
          onClick={onShare}
          className="px-4 py-2.5 border border-warm-300 hover:border-warm-400 text-warm-600 hover:text-warm-800 rounded-lg transition-colors text-sm"
        >
          {sharing ? "Sharing..." : "Share"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 border border-warm-300 hover:border-warm-400 text-warm-600 hover:text-warm-800 rounded-lg transition-colors text-sm"
        >
          Check Another
        </button>

        <a
          href="/projects"
          className="px-4 py-2.5 border border-warm-300 hover:border-warm-400 text-warm-600 hover:text-warm-800 rounded-lg transition-colors text-sm text-center"
        >
          Explore Similar
        </a>
      </div>
    </div>
  );
}
