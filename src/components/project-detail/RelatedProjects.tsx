import Link from "next/link";
import { ProjectData } from "@/types";
import { StatusBadge } from "@/components/Badges";
import { scoreColor } from "@/lib/score-color";

interface RelatedProjectsProps {
  relatedProjects: ProjectData[];
  categoryLabel: string;
}

export default function RelatedProjects({ relatedProjects, categoryLabel }: RelatedProjectsProps) {
  if (!relatedProjects.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-warm-900 mb-3">Related {categoryLabel} Projects</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {relatedProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="p-3 bg-white border border-warm-300 rounded-lg hover:border-warm-400 transition-all text-center group"
          >
            <p className={`text-lg font-bold font-mono ${scoreColor(project.survivalScore)}`}>
              {project.survivalScore}
            </p>
            <p className="text-sm text-warm-900 group-hover:text-ship-600 transition-colors mt-1">
              {project.name}
            </p>
            <StatusBadge status={project.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
