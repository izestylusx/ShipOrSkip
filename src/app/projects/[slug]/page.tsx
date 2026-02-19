import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTag, StatusBadge } from "@/components/Badges";
import MetricsTable from "@/components/project-detail/MetricsTable";
import PostMortemPanel from "@/components/project-detail/PostMortemPanel";
import RelatedProjects from "@/components/project-detail/RelatedProjects";
import ScoreBreakdown from "@/components/project-detail/ScoreBreakdown";
import PipelineMetrics from "@/components/project-detail/PipelineMetrics";
import { getProjectBySlug, getProjects } from "@/lib/data";
import { sharesAnyCategory } from "@/lib/project-categories";
import { scoreColor } from "@/lib/score-color";
import type { ProjectData } from "@/types";
import type { PipelineProject } from "@/types/pipeline";

export const revalidate = 600;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: "Not Found" };
  return {
    title: `${project.name} - ShipOrSkip Analysis`,
    description: `Survival score: ${project.survivalScore}/100. Status: ${project.status}. ${project.category} on BNB Chain.`,
  };
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const allProjects = await getProjects();
  const relatedProjects = allProjects
    .filter((candidate) => candidate.id !== project.id && sharesAnyCategory(project, candidate))
    .sort((left, right) => right.survivalScore - left.survivalScore)
    .slice(0, 4);

  // Pipeline v2 raw data (attached by mapper)
  const pipeline = (project as ProjectData & { _pipeline?: PipelineProject })._pipeline ?? null;

  return (
    <main className="min-h-screen bg-warm-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-warm-600 mb-6">
          <Link href="/projects" className="hover:text-warm-900 transition-colors">
            Explorer
          </Link>
          <span>{">"}  </span>
          <span className="text-warm-700">{project.name}</span>
        </div>

        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center flex-wrap gap-3 mb-2">
              <h1 className="text-3xl font-bold text-warm-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <CategoryTag category={project.category} />
              {project.twitterHandle && (
                <a
                  href={`https://x.com/${project.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-warm-600 hover:text-data-600 transition-colors"
                >
                  @{project.twitterHandle}
                </a>
              )}
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-warm-600 hover:text-data-600 transition-colors"
                >
                  Website {"->"}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-warm-300"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={scoreColor(project.survivalScore)}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${project.survivalScore}, 100`}
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-xl font-bold font-mono ${scoreColor(project.survivalScore)}`}
              >
                {project.survivalScore}
              </span>
            </div>
            <div>
              <p className="text-warm-600 text-sm">Survival Score</p>
              <p className="text-warm-500 text-xs">out of 100</p>
            </div>
          </div>
        </section>

        <MetricsTable token={project.token} contract={project.contract} />
        {pipeline && <PipelineMetrics project={pipeline} />}
        <ScoreBreakdown factors={project.factors} category={project.category} />
        <PostMortemPanel postMortem={project.postMortem} aliveSummary={project.aliveSummary} />

        {project.onchainTxHash && (
          <section className="mb-8 p-4 bg-white border border-warm-300 rounded-lg">
            <p className="text-xs text-warm-600 mb-1">Onchain Score Registration</p>
            <a
              href={`https://bscscan.com/tx/${project.onchainTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-data-600 hover:text-data-500 text-sm font-mono break-all"
            >
              {project.onchainTxHash}
            </a>
          </section>
        )}

        {project.dataSources.length > 0 && (
          <section className="mb-8">
            <p className="text-xs text-warm-600 mb-2">Data sources</p>
            <div className="flex flex-wrap gap-1.5">
              {project.dataSources.map((source) => (
                <span
                  key={source}
                  className="text-[10px] font-mono text-warm-600 bg-warm-200 px-2 py-0.5 rounded"
                >
                  {source}
                </span>
              ))}
            </div>
          </section>
        )}

        <RelatedProjects relatedProjects={relatedProjects} categoryLabel={project.category} />

        {project.analyzedAt && (
          <p className="text-xs text-warm-500 text-center">
            Last analyzed: {new Date(project.analyzedAt).toLocaleString()}
          </p>
        )}
      </div>
    </main>
  );
}
