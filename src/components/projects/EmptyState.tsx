interface EmptyStateProps {
  onClear: () => void;
}

export default function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="text-center py-20 px-4 border border-warm-100 rounded-2xl bg-warm-50/50">
      <p className="text-lg font-medium text-warm-800">No projects match your filters</p>
      <p className="text-sm text-warm-500 mt-2">
        Try broadening category or status to see more matches.
      </p>
      <button
        onClick={onClear}
        className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-full border border-warm-300 hover:border-warm-400 bg-white hover:bg-warm-50 text-warm-700 hover:text-warm-900 transition-all shadow-warm-sm"
      >
        Clear all filters
      </button>
    </div>
  );
}
