import { ValidationHistoryItem } from "@/components/validator/types";

interface ValidationHistoryProps {
  items: ValidationHistoryItem[];
  progress: {
    count: number;
    target: number;
    percent: number;
  };
  onClear: () => void;
}

function signalColor(signal: ValidationHistoryItem["signal"]) {
  if (signal === "SHIP") return "text-ship-700";
  if (signal === "SHIP_WITH_CAUTION") return "text-wait-700";
  return "text-skip-700";
}

export default function ValidationHistory({
  items,
  progress,
  onClear,
}: ValidationHistoryProps) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <div className="p-4 border border-warm-300 rounded-xl bg-white">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-warm-700">My Previous Validations</p>
          <button
            onClick={onClear}
            className="text-xs text-warm-500 hover:text-warm-700 transition-colors"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-warm-600 mb-2">
          Progress: {progress.count}/{progress.target} ideas validated
        </p>
        <div className="h-1 bg-warm-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-ship-500 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="p-3 border border-warm-300 rounded-lg bg-white"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-warm-800 line-clamp-1">{item.description}</p>
              <span className={`text-xs font-mono ${signalColor(item.signal)}`}>{item.pmfScore}</span>
            </div>
            <p className="text-xs text-warm-600 mt-1">
              {item.category} • {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
