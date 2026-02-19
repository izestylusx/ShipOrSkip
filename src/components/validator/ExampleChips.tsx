interface ExampleChip {
  label: string;
  category: string;
}

interface CategoryStat {
  category: string;
  count: number;
}

interface ExampleChipsProps {
  examples: ExampleChip[];
  topCategories: CategoryStat[];
  onSelect: (example: ExampleChip) => void;
}

export default function ExampleChips({
  examples,
  topCategories,
  onSelect,
}: ExampleChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {examples.map((example) => (
          <button
            key={example.label}
            onClick={() => onSelect(example)}
            className="text-xs px-3 py-1.5 rounded-full border border-warm-300 text-warm-600 hover:text-warm-900 hover:border-warm-500 transition-colors"
          >
            {example.label}
          </button>
        ))}
      </div>

      {topCategories.length > 0 && (
        <p className="text-[11px] text-warm-600 text-center">
          Most validated categories:{" "}
          {topCategories.map((item) => `${item.category} (${item.count})`).join("  ")}
        </p>
      )}
    </div>
  );
}
