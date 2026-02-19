import { ProjectStatus } from "@/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string; dot: string }
> = {
  alive: {
    label: "Alive",
    className: "bg-ship-50 text-ship-700 border-ship-200",
    dot: "bg-ship-500",
  },
  zombie: {
    label: "Zombie",
    className: "bg-wait-50 text-wait-700 border-wait-200",
    dot: "bg-wait-500",
  },
  dead: {
    label: "Dead",
    className: "bg-skip-50 text-skip-700 border-skip-200",
    dot: "bg-skip-500",
  },
  pivoted: {
    label: "Pivoted",
    className: "bg-data-50 text-data-600 border-data-200",
    dot: "bg-data-500",
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-full ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  let color = "text-skip-700 border-skip-200 bg-skip-50";
  if (score >= 50) color = "text-ship-700 border-ship-200 bg-ship-50";
  else if (score >= 35)
    color = "text-wait-700 border-wait-200 bg-wait-50";

  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold border rounded-lg font-mono ${color}`}
    >
      {score}
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="text-[11px] font-mono text-warm-700 bg-warm-200 px-1.5 py-0.5 rounded">
      {category}
    </span>
  );
}

type ValidationSignal = "SHIP" | "HIGH_RISK" | "SHIP_WITH_CAUTION";

const signalConfig: Record<
  ValidationSignal,
  { label: string; emoji: string; className: string }
> = {
  SHIP: {
    label: "SHIP IT",
    emoji: "🚀",
    className: "bg-ship-50 text-ship-700 border-ship-200 shadow-glow-ship",
  },
  HIGH_RISK: {
    label: "HIGH RISK",
    emoji: "⚠️",
    className: "bg-skip-50 text-skip-700 border-skip-200 shadow-glow-skip",
  },
  SHIP_WITH_CAUTION: {
    label: "CAUTION",
    emoji: "🔶",
    className: "bg-wait-50 text-wait-700 border-wait-200 shadow-glow-wait",
  },
};

export function SignalBadge({ signal }: { signal: ValidationSignal }) {
  const config = signalConfig[signal];
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 text-lg font-bold border rounded-xl ${config.className}`}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}
