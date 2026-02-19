"use client";

import { useState } from "react";

export default function FeedbackRow() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-warm-300 bg-white">
      <p className="text-xs text-warm-600">Was this analysis useful?</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFeedback("up")}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
            feedback === "up"
              ? "border-ship-500/40 bg-ship-50 text-ship-700"
              : "border-warm-300 text-warm-600 hover:text-warm-900 hover:border-warm-500"
          }`}
        >
          Helpful
        </button>
        <button
          type="button"
          onClick={() => setFeedback("down")}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
            feedback === "down"
              ? "border-skip-500/40 bg-skip-50 text-skip-700"
              : "border-warm-300 text-warm-600 hover:text-warm-900 hover:border-warm-500"
          }`}
        >
          Not clear
        </button>
      </div>
    </div>
  );
}
