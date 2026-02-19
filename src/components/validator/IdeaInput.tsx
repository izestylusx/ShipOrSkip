import { FormEvent } from "react";
import type { InferredCategory } from "@/components/validator/types";

interface IdeaInputProps {
  description: string;
  selectedCategories: string[];
  suggestedCategories: InferredCategory[];
  targetUsers: string;
  categories: string[];
  loading: boolean;
  privateMode: boolean;
  onDescriptionChange: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onTargetUsersChange: (value: string) => void;
  onPrivateModeChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

export default function IdeaInput({
  description,
  selectedCategories,
  suggestedCategories,
  targetUsers,
  categories,
  loading,
  privateMode,
  onDescriptionChange,
  onToggleCategory,
  onTargetUsersChange,
  onPrivateModeChange,
  onSubmit,
}: IdeaInputProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-warm-600 mb-1.5">
          Describe your idea <span className="text-warm-500">({description.length}/500)</span>
        </label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value.slice(0, 500))}
          placeholder="A decentralized exchange aggregator on BNB Chain that finds the best swap routes..."
          className="w-full h-28 px-4 py-3 bg-white border border-warm-300 rounded-lg text-warm-900 placeholder:text-warm-500 focus:outline-none focus:border-ship-500/50 focus:ring-1 focus:ring-ship-500/20 resize-none transition-colors"
          minLength={20}
          maxLength={500}
          required
        />
        {description.length > 0 && description.length < 20 && (
          <p className="text-skip-400 text-xs mt-1">
            Minimum 20 characters ({20 - description.length} more needed)
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-warm-600 mb-1.5">
            Category Scope <span className="text-warm-500">(optional)</span>
          </label>
          <p className="text-xs text-warm-600 mb-2">
            Leave empty to auto-detect. Select one or more to override AI category detection.
          </p>
          {suggestedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestedCategories.map((item) => {
                const isSelected = selectedCategories.includes(item.category);
                return (
                  <button
                    key={`suggested-${item.category}`}
                    type="button"
                    onClick={() => onToggleCategory(item.category)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      isSelected
                        ? "border-ship-600 bg-ship-50 text-ship-700"
                        : "border-warm-300 text-warm-600 hover:text-warm-900 hover:border-warm-400"
                    }`}
                  >
                    AI: {item.category} ({Math.round(item.confidence * 100)}%)
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const isSelected = selectedCategories.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleCategory(item)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    isSelected
                      ? "border-ship-600 bg-ship-50 text-ship-700"
                      : "border-warm-300 text-warm-600 hover:text-warm-900 hover:border-warm-400"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-warm-600 mt-2">
            {selectedCategories.length > 0
              ? `Using manual scope: ${selectedCategories.join(", ")}`
              : "Auto mode active: categories will be inferred from your idea"}
          </p>
        </div>

        <div>
          <label className="block text-sm text-warm-600 mb-1.5">
            Target Users <span className="text-warm-500">(optional)</span>
          </label>
          <input
            value={targetUsers}
            onChange={(event) => onTargetUsersChange(event.target.value)}
            placeholder="DeFi traders, gamers..."
            className="w-full px-3 py-2.5 bg-white border border-warm-300 rounded-lg text-warm-900 placeholder:text-warm-500 focus:outline-none focus:border-ship-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Private validation toggle (premium) */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-warm-300 bg-white">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-ship-500/70">
            <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-warm-600">Private validation</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ship-50 text-ship-700 font-medium">PREMIUM</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={privateMode}
          onClick={() => onPrivateModeChange(!privateMode)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            privateMode ? "bg-ship-500" : "bg-warm-400"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              privateMode ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || description.length < 20}
        className="w-full py-3 bg-ship-500 hover:bg-ship-600 disabled:bg-warm-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? "Analyzing..." : "Analyze Idea"}
      </button>

      {/* Ecosystem contribution notice */}
      <p className="text-[11px] text-warm-500 text-center leading-relaxed">
        {privateMode ? (
          <>
            <span className="text-ship-500/80">Private mode</span> — your idea will not be stored or used for ecosystem intelligence.
          </>
        ) : (
          <>
            By validating, your idea contributes anonymously to BNB ecosystem intelligence.
            No personal data is stored.{" "}
            <span className="text-ship-500/60">Premium users</span> get private validations.
          </>
        )}
      </p>
    </form>
  );
}
