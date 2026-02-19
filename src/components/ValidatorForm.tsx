"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Contract, BrowserProvider } from "ethers";
import ExampleChips from "@/components/validator/ExampleChips";
import IdeaInput from "@/components/validator/IdeaInput";
import LoadingOverlay from "@/components/validator/LoadingOverlay";
import ValidationHistory from "@/components/validator/ValidationHistory";
import ValidationResult from "@/components/validator/ValidationResult";
import { ValidationResultData } from "@/components/validator/types";
import { useValidationHistory } from "@/hooks/useValidationHistory";
import { ALL_CATEGORIES, inferCategoriesFromDescription } from "@/lib/category-inference";
import { exportValidationMarkdown } from "@/lib/exportMarkdown";
import { exportValidationPng } from "@/lib/exportPng";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const EXAMPLES = [
  { label: "DEX aggregator on BSC", category: "DEX" },
  { label: "Play-to-earn RPG game", category: "Gaming" },
  { label: "AI-powered yield optimizer", category: "Yield" },
  { label: "BNB meme token launcher", category: "Meme" },
];

const LOADING_STAGES = [
  "Scanning BNB ecosystem data sources...",
  "Matching against 100+ curated BNB projects...",
  "Identifying closest competitors & survival rates...",
  "Fetching latest X/Twitter posts from similar projects...",
  "Analyzing social narrative & community sentiment...",
  "Cross-referencing on-chain activity signals...",
  "Running PMF scoring model...",
  "Generating builder-ready intel briefing...",
  "Finalizing your Ship or Skip verdict...",
];

const SCOREBOARD_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xd6a229D8cFbde4be596dd9Cd53d1b3E8bD272432";

const SCOREBOARD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "56");
const SCOREBOARD_CHAIN_HEX = `0x${SCOREBOARD_CHAIN_ID.toString(16)}`;
const SCOREBOARD_EXPLORER_BASE = (
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || "https://bscscan.com"
).replace(/\/+$/, "");
const VALIDATION_EXPORT_TARGET_ID = "validation-result-export";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const SCOREBOARD_ABI = [
  "function submitIdea(string category, uint8 pmfScore) external returns (bytes32)",
];

function getErrorMessage(status: number, fallback: string): string {
  if (status === 429) return "Rate limited. Max 5 validations per 10 minutes.";
  if (status >= 500) return "Server is temporarily busy. Please retry in a moment.";
  return fallback;
}

function makeExportBaseName(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "validation-report"
  );
}

export default function ValidatorForm() {
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [targetUsers, setTargetUsers] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<ValidationResultData | null>(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [submittedIdeaText, setSubmittedIdeaText] = useState("");
  const [submittingOnchain, setSubmittingOnchain] = useState(false);
  const [onchainTxHash, setOnchainTxHash] = useState<string | null>(null);
  const [onchainError, setOnchainError] = useState("");
  const [exportingMarkdown, setExportingMarkdown] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const { history, saveValidation, clearHistory, progress } = useValidationHistory();

  /* ---- Listen for "Validate Idea" nav click while already on /validate ---- */
  const resetAll = useCallback(() => {
    setDescription("");
    setSelectedCategories([]);
    setTargetUsers("");
    setResult(null);
    setError("");
    setOnchainTxHash(null);
    setOnchainError("");
    setExportingMarkdown(false);
    setExportingPng(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handler = () => resetAll();
    window.addEventListener("resetValidator", handler);
    return () => window.removeEventListener("resetValidator", handler);
  }, [resetAll]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of history) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([name, count]) => ({ category: name, count }));
  }, [history]);

  const suggestedCategories = useMemo(
    () =>
      inferCategoriesFromDescription(description, 3).map((item) => ({
        category: item.category,
        confidence: item.confidence,
        matchedSignals: item.matchedSignals,
      })),
    [description]
  );

  const exportBaseName = useMemo(() => {
    const source = (submittedIdeaText || description).trim();
    return `ship-or-skip-${makeExportBaseName(source || "analysis")}`;
  }, [submittedIdeaText, description]);

  const handleToggleCategory = (value: string) => {
    setSelectedCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!description || description.length < 20) return;

    // Require CAPTCHA token if Turnstile is configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please wait for the security check to complete, then try again.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setLoadingStage(0);
    setOnchainTxHash(null);
    setOnchainError("");
    setExportingMarkdown(false);
    setExportingPng(false);
    setSubmittedIdeaText(description);

    // Auto-advance stages but ensure we don't jump backward if the server says otherwise later
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => {
        // Only advance if we haven't reached the end
        const next = prev < LOADING_STAGES.length - 1 ? prev + 1 : prev;
        return Math.max(prev, next);
      });
    }, 8000);

    try {
      // Step 1: Submit idea (returns immediately with jobId)
      const submitResponse = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category: selectedCategories[0] ?? "",
          categories: selectedCategories,
          targetUsers,
          privateMode,
          cfTurnstileToken: turnstileToken ?? undefined,
        }),
      });

      if (!submitResponse.ok) {
        clearInterval(stageInterval);
        const payload = (await submitResponse.json().catch(() => null)) as { error?: string } | null;
        const defaultMessage = payload?.error ?? "Unable to analyze this idea right now.";
        setError(getErrorMessage(submitResponse.status, defaultMessage));
        return;
      }

      const submitData = (await submitResponse.json()) as {
        jobId: string;
        status: string;
        preview?: {
          ecosystemIntelligence?: ValidationResultData["ecosystemIntelligence"];
          communityStats?: ValidationResultData["communityStats"];
          [key: string]: unknown;
        };
      };

      const { jobId } = submitData;

      // Capture ecosystem & community data from preview (available immediately)
      const previewEcosystem = submitData.preview?.ecosystemIntelligence;
      const previewCommunity = submitData.preview?.communityStats;

      // Step 2: Poll for result
      const POLL_INTERVAL_MS = 3000;
      const MAX_POLL_TIME_MS = 180_000; // 3 minutes max
      const pollStart = Date.now();

      const pollResult = await new Promise<ValidationResultData>((resolve, reject) => {
        const poll = async () => {
          if (Date.now() - pollStart > MAX_POLL_TIME_MS) {
            reject(new Error("Validation timed out. The analysis is taking too long."));
            return;
          }

          try {
            const statusResponse = await fetch(`/api/validate/status?jobId=${jobId}`);
            const statusData = await statusResponse.json() as {
              status: string;
              result?: ValidationResultData;
              step?: string;
              error?: string;
              duration?: number;
            };

            if (statusData.status === "completed" && statusData.result) {
              resolve(statusData.result);
              return;
            }

            if (statusData.status === "failed") {
              reject(new Error(statusData.error ?? "Validation failed"));
              return;
            }

            // Update loading stage based on backend step, respecting the max flow
            if (statusData.step === "intel") {
              setLoadingStage((prev) => Math.max(prev, 2)); // Searching live Twitter/X
            } else if (statusData.step === "verdict") {
              setLoadingStage((prev) => Math.max(prev, 4)); // Generating intel briefing
            }

            // Still processing, poll again
            setTimeout(poll, POLL_INTERVAL_MS);
          } catch {
            // Network error during polling, retry
            setTimeout(poll, POLL_INTERVAL_MS);
          }
        };

        poll();
      });

      clearInterval(stageInterval);

      // Merge preview ecosystem/community data into poll result
      const enrichedResult: ValidationResultData = {
        ...pollResult,
        ecosystemIntelligence: pollResult.ecosystemIntelligence ?? previewEcosystem,
        communityStats: pollResult.communityStats ?? previewCommunity,
      };

      setResult(enrichedResult);

      // Auto-scroll to top so user sees the result immediately
      window.scrollTo({ top: 0, behavior: "smooth" });

      saveValidation({
        id: `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`,
        description,
        category:
          enrichedResult.categoryContext?.primaryCategory ??
          selectedCategories[0] ??
          suggestedCategories[0]?.category ??
          "Auto",
        signal: enrichedResult.signal,
        pmfScore: enrichedResult.pmfScore,
        timestamp: new Date().toISOString(),
      });
    } catch (requestError) {
      clearInterval(stageInterval);

      if ((requestError as Error).name === "AbortError") {
        setError("Request timeout. Try a shorter idea description and retry.");
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("You appear to be offline. Check connection and retry.");
      } else {
        setError((requestError as Error).message || "Network error while contacting validator API.");
      }
    } finally {
      // Small delay to let the progress bar hit 100% visually if needed, but usually we just unmount overlay
      setTimeout(() => setLoading(false), 500);
      // Reset CAPTCHA so next submission gets a fresh token
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  const handleSubmitOnchain = async () => {
    if (!result) return;

    const ethereum = (window as Window & { ethereum?: unknown }).ethereum as
      | {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      }
      | undefined;

    if (!ethereum) {
      setOnchainError("No wallet detected. Install MetaMask or a compatible wallet.");
      return;
    }

    setSubmittingOnchain(true);
    setOnchainError("");

    try {
      const provider = new BrowserProvider(ethereum);

      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SCOREBOARD_CHAIN_ID) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SCOREBOARD_CHAIN_HEX }],
        });
      }

      const signer = await provider.getSigner();
      const contract = new Contract(SCOREBOARD_ADDRESS, SCOREBOARD_ABI, signer);

      const category = result.categoryContext?.primaryCategory ?? "Infrastructure";
      const boundedScore = Math.max(0, Math.min(100, result.pmfScore));

      const tx = await contract.submitIdea(category, boundedScore);
      const receipt = await tx.wait();
      const hash = receipt?.hash || tx.hash;

      setOnchainTxHash(hash);
    } catch (transactionError) {
      const message =
        transactionError instanceof Error
          ? transactionError.message
          : "Failed to submit idea onchain.";
      setOnchainError(message);
    } finally {
      setSubmittingOnchain(false);
    }
  };

  const handleExampleSelect = (example: { label: string; category: string }) => {
    setDescription(example.label);
    setSelectedCategories([example.category]);
    setResult(null);
    setError("");
  };

  const handleReset = () => resetAll();

  const handleShare = async () => {
    if (!result) return;
    setSharing(true);

    const text = `ShipOrSkip verdict: ${result.signal} (${result.pmfScore}/100) for "${description}".`;
    const sharePayload = { title: "ShipOrSkip Validation", text, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      }
    } catch {
      // Ignore share cancellation.
    } finally {
      setSharing(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!result || !onchainTxHash) {
      setOnchainError("Register onchain first to unlock downloads.");
      return;
    }

    setExportingMarkdown(true);
    setOnchainError("");

    try {
      exportValidationMarkdown({
        description: submittedIdeaText || description,
        result,
        onchainTxHash,
        explorerTxBaseUrl: `${SCOREBOARD_EXPLORER_BASE}/tx`,
        fileName: `${exportBaseName}.md`,
      });
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "Failed to export markdown.";
      setOnchainError(message);
    } finally {
      setExportingMarkdown(false);
    }
  };

  const handleExportPng = async () => {
    if (!result || !onchainTxHash) {
      setOnchainError("Register onchain first to unlock downloads.");
      return;
    }

    const exportTarget = document.getElementById(VALIDATION_EXPORT_TARGET_ID);
    if (!exportTarget) {
      setOnchainError("Could not find result section to export.");
      return;
    }

    setExportingPng(true);
    setOnchainError("");

    try {
      await exportValidationPng({
        element: exportTarget,
        onchainTxHash,
        fileName: `${exportBaseName}.png`,
      });
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "Failed to export PNG.";
      setOnchainError(message);
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="space-y-8 relative min-h-[600px]">
      {/* Loading Overlay - Rendered conditionally */}
      {loading && (
        <LoadingOverlay
          stages={LOADING_STAGES}
          currentStage={loadingStage}
          projectHint="Matching against 100+ curated BNB projects and their survival outcomes."
        />
      )}

      {!result ? (
        /* ================= INPUT VIEW ================= */
        <div className={`max-w-2xl mx-auto space-y-8 transition-all duration-500 ${loading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className="space-y-6">
            <ExampleChips examples={EXAMPLES} topCategories={topCategories} onSelect={handleExampleSelect} />

            <IdeaInput
              description={description}
              selectedCategories={selectedCategories}
              suggestedCategories={suggestedCategories}
              targetUsers={targetUsers}
              categories={ALL_CATEGORIES}
              loading={loading}
              privateMode={privateMode}
              onDescriptionChange={setDescription}
              onToggleCategory={handleToggleCategory}
              onTargetUsersChange={setTargetUsers}
              onPrivateModeChange={setPrivateMode}
              onSubmit={handleSubmit}
            />

            {TURNSTILE_SITE_KEY && (
              <div className="flex justify-center pt-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  options={{ theme: "light", size: "normal" }}
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-skip-50 border border-skip-200 rounded-lg text-skip-700 text-sm animate-shake">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-warm-200 pt-8">
            <ValidationHistory items={history} progress={progress} onClear={clearHistory} />
          </div>
        </div>
      ) : (
        /* ================= RESULT VIEW ================= */
        <div className="animate-slide-up space-y-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleReset}
              className="group flex items-center gap-2 text-sm font-medium text-warm-600 hover:text-warm-900 transition-colors px-3 py-2 rounded-lg hover:bg-warm-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Analyze Another Idea
            </button>
          </div>

          <ValidationResult
            result={result}
            sharing={sharing}
            onShare={handleShare}
            onReset={handleReset}
            // Mobile close button not needed in this full-page view mode
            onCloseMobile={undefined}
            onSubmitOnchain={handleSubmitOnchain}
            submittingOnchain={submittingOnchain}
            onchainTxHash={onchainTxHash}
            onchainError={onchainError}
            onExportMarkdown={handleExportMarkdown}
            onExportPng={handleExportPng}
            exportingMarkdown={exportingMarkdown}
            exportingPng={exportingPng}
            exportTargetId={VALIDATION_EXPORT_TARGET_ID}
          />

          <div className="max-w-2xl mx-auto pt-10 border-t border-warm-200">
            <ValidationHistory items={history} progress={progress} onClear={clearHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
