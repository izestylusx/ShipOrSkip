import Link from "next/link";
import { ProjectData } from "@/types";
import { CategoryTag, ScoreBadge, StatusBadge } from "@/components/Badges";

interface ProjectCardProps {
  project: ProjectData;
}

function formatMarketCap(value: number | null | undefined): string | null {
  if (!value) return null;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function MiniBar({ label, value }: { label: string; value: number | undefined }) {
  const score = value ?? 0;
  let color = "bg-skip-500/60";
  if (score >= 60) color = "bg-ship-500/60";
  else if (score >= 35) color = "bg-wait-500/60";

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] text-warm-600 mb-0.5">
        <span>{label}</span>
        <span>{score}</span>
      </div>
      <div className="h-1 bg-warm-300 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const marketCap = formatMarketCap(project.token?.marketCap);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block p-4 bg-white border border-warm-200 rounded-xl hover:border-warm-300 hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-warm-900 font-semibold group-hover:text-ship-600 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <CategoryTag category={project.category} />
            {marketCap && (
              <span className="text-[11px] font-mono text-warm-600">{marketCap}</span>
            )}
          </div>
        </div>
        <ScoreBadge score={project.survivalScore} />
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={project.status} />
        {project.token?.priceChange24h !== undefined && project.token.priceChange24h !== 0 && (
          <span
            className={`text-xs font-mono ${project.token.priceChange24h > 0 ? "text-ship-700" : "text-skip-700"
              }`}
          >
            {project.token.priceChange24h > 0 ? "+" : ""}
            {project.token.priceChange24h.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1">
        <MiniBar label="Users" value={project.factors.userActivity ?? project.factors.txTrend} />
        <MiniBar label="TX" value={project.factors.txTrend} />
        <MiniBar label="Community" value={project.factors.communityEngagement} />
      </div>
    </Link>
  );
}
