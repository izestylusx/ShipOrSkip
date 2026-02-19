"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

/* ──────────────── Fun facts to keep users engaged ──────────────── */
const FUN_FACTS = [
  "💡 BNB Chain processes ~30M transactions daily — more than Ethereum & Solana combined.",
  "📊 Over 1,400 dApps have launched on BNB Chain since 2020.",
  "🧠 We analyze project survival rates from the past 3 years to predict yours.",
  "🔍 Our AI cross-references DeFiLlama, DappBay, and X/Twitter data in real-time.",
  "⚡ The average BNB dApp lives only 4 months. Ship or Skip helps you beat the odds.",
  "🏆 Projects with clear target users score 2× higher on our PMF model.",
  "📈 Gaming & AI are the fastest-growing BNB categories in 2026.",
  "🔗 Every validation is optionally recorded on-chain for transparent scoring.",
  "🎯 PMF (Product-Market Fit) score predicts real builder success, not just hype.",
  "🌐 We check competitor TVL, social activity, and team signals before scoring.",
];

/* ──────────── Sub-messages when stuck in final phase ──────────── */
const FINAL_PHASE_MESSAGES = [
  "Almost there — polishing the analysis...",
  "Wrapping up final checks...",
  "Double-checking competitor data accuracy...",
  "Cross-validating scoring model outputs...",
  "Just a few more seconds...",
];

interface LoadingOverlayProps {
  stages: string[];
  currentStage: number;
  projectHint: string;
}

export default function LoadingOverlay({
  stages,
  currentStage,
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * FUN_FACTS.length)
  );
  const [factVisible, setFactVisible] = useState(true);
  const [finalMsgIndex, setFinalMsgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ── Elapsed timer ── */
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Rotate fun facts every 6s ── */
  useEffect(() => {
    const t = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((i) => (i + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  /* ── Final-phase sub-messages every 8s ── */
  useEffect(() => {
    if (currentStage < stages.length - 1) return;
    const t = setInterval(
      () => setFinalMsgIndex((i) => (i + 1) % FINAL_PHASE_MESSAGES.length),
      8000
    );
    return () => clearInterval(t);
  }, [currentStage, stages.length]);

  /* ── Smooth progress (never stalls visually) ── */
  useEffect(() => {
    const isLastStage = currentStage >= stages.length - 1;
    let targetProgress: number;

    if (isLastStage) {
      // Creep slowly from 88→97 so bar always moves
      targetProgress = Math.min(97, 88 + elapsed * 0.12);
    } else {
      targetProgress = Math.min(
        88,
        Math.max(5, ((currentStage + 0.6) / stages.length) * 90)
      );
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetProgress) return prev;
        const diff = targetProgress - prev;
        const step = Math.max(0.08, diff * 0.04);
        return Math.min(targetProgress, prev + step);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [currentStage, stages.length, elapsed]);

  /* ── Formatted time ── */
  const timeStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, [elapsed]);

  /* ── ETA hint ── */
  const etaHint = useMemo(() => {
    if (elapsed < 10) return "Usually takes 60–90 seconds";
    if (elapsed < 40) return "Hang tight — deep analysis in progress";
    if (elapsed < 70) return "Almost done — finalizing your intel";
    if (elapsed < 100) return "Just a few more seconds...";
    return "Taking longer than usual — still working";
  }, [elapsed]);

  /* ── Stage display text ── */
  const stageMessage =
    currentStage >= stages.length - 1 && elapsed > 50
      ? FINAL_PHASE_MESSAGES[finalMsgIndex]
      : stages[currentStage];

  /* ── SVG ring math ── */
  const RADIUS = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-100/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="max-w-md w-full space-y-6 text-center">

        {/* ── Circular progress ring ── */}
        <div className="relative w-20 h-20 mx-auto">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r={RADIUS}
              fill="none" stroke="currentColor" strokeWidth="5"
              className="text-warm-200"
            />
            <circle
              cx="40" cy="40" r={RADIUS}
              fill="none" stroke="url(#shipGrad)" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="shipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-ship-600 text-lg tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* ── Title + elapsed ── */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-warm-900">
            Analyzing your idea
            <span className="inline-block w-5 text-left animate-pulse">...</span>
          </h3>
          <p className="text-warm-500 text-xs font-mono tabular-nums">
            {timeStr} elapsed&nbsp;·&nbsp;{etaHint}
          </p>
        </div>

        {/* ── Current stage message ── */}
        <div className="h-12 flex items-center justify-center overflow-hidden">
          <p
            key={stageMessage}
            className="text-ship-700 font-mono font-medium text-sm animate-slide-up"
          >
            {stageMessage}
          </p>
        </div>

        {/* ── Progress bar + dots ── */}
        <div className="space-y-3">
          <div className="relative h-2 bg-warm-200 rounded-full overflow-hidden w-full max-w-sm mx-auto">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s linear infinite",
              }}
            />
          </div>

          <div className="flex justify-center gap-1.5">
            {stages.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx < currentStage
                    ? "bg-ship-500"
                    : idx === currentStage
                    ? "bg-ship-500 scale-150 ring-2 ring-ship-200"
                    : "bg-warm-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Rotating fun fact ── */}
        <div className="mt-2 px-2">
          <div
            className={`bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-warm-200 transition-all duration-400 ${
              factVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <p className="text-warm-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
              Did you know?
            </p>
            <p className="text-warm-700 text-sm leading-relaxed">
              {FUN_FACTS[factIndex]}
            </p>
          </div>
        </div>

        {/* ── Reassurance (appears after 30s) ── */}
        {elapsed >= 30 && (
          <p className="text-warm-400 text-xs animate-fade-in flex items-center justify-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ship-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ship-500" />
            </span>
            Connection active — AI is still processing your analysis
          </p>
        )}
      </div>

      {/* Shimmer keyframe for progress bar */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
