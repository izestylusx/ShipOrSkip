import { Category, ProjectStatus } from "@/types";

export type SortKey = "score" | "name" | "category" | "status" | "marketCap";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ProjectStatus | "all";
  onStatusChange: (value: ProjectStatus | "all") => void;
  categoryFilter: Category | "all";
  onCategoryChange: (value: Category | "all") => void;
  sortKey: SortKey;
  onSortChange: (value: SortKey) => void;
  categories: Category[];
  counts: {
    all: number;
    alive: number;
    zombie: number;
    dead: number;
  };
}

const statusFilters: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "alive", label: "Alive" },
  { value: "zombie", label: "Zombie" },
  { value: "dead", label: "Dead" },
];

export default function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  sortKey,
  onSortChange,
  categories,
  counts,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects..."
          className="w-full sm:w-64 px-4 py-2 bg-white border border-warm-200 rounded-full text-warm-900 placeholder:text-warm-400 text-sm focus:outline-none focus:border-ship-500 focus:ring-1 focus:ring-ship-500 transition-all shadow-sm"
        />

        <select
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value as Category | "all")}
          className="px-4 py-2 bg-white border border-warm-200 rounded-full text-warm-700 text-sm focus:outline-none focus:border-ship-500 focus:ring-1 focus:ring-ship-500 appearance-none cursor-pointer shadow-sm hover:border-warm-300 transition-colors"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className="px-4 py-2 bg-white border border-warm-200 rounded-full text-warm-700 text-sm focus:outline-none focus:border-ship-500 focus:ring-1 focus:ring-ship-500 appearance-none cursor-pointer shadow-sm hover:border-warm-300 transition-colors"
        >
          <option value="score">Sort: Score</option>
          <option value="name">Sort: Name</option>
          <option value="category">Sort: Category</option>
          <option value="status">Sort: Status</option>
          <option value="marketCap">Sort: Market Cap</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all border ${statusFilter === filter.value
              ? "bg-ship-600 text-white border-ship-600 shadow-sm"
              : "bg-white text-warm-600 border-warm-200 hover:border-warm-300 hover:bg-warm-50"
              }`}
          >
            {filter.label}{" "}
            <span className={statusFilter === filter.value ? "text-ship-100" : "text-warm-400"}>
              {counts[filter.value as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
