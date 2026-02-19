import Link from "next/link";
import { ProjectData } from "@/types";

interface EvidenceSectionProps {
  topAlive: ProjectData[];
  topDead: ProjectData[];
}

function ScoreBar({ score, inverse }: { score: number; inverse?: boolean }) {
  const width = inverse ? Math.min(100, 100 - score) : score;
  const color = inverse ? "bg-skip-500/70" : "bg-ship-500/70";
  return (
    <div className="h-1 bg-warm-300 rounded-full overflow-hidden w-20">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function EvidenceSection({ topAlive, topDead }: EvidenceSectionProps) {
  const deadWithLowScore = topDead.filter((project) => project.survivalScore <= 35).length;

  return (
    <section className="py-20 px-4 border-t border-warm-200 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-500">Evidence Briefing</p>
          <p className="text-lg text-warm-800 max-w-2xl mx-auto font-medium leading-relaxed">
            <span className="text-skip-600 font-bold">{deadWithLowScore} failed projects</span> share the same fatal signal: low sustained activity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white rounded-2xl p-6 border border-warm-200 shadow-warm-sm hover:shadow-warm-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-warm-100">
              <div className="w-2 h-2 rounded-full bg-ship-500 animate-pulse" />
              <h3 className="text-sm font-bold text-ship-800 uppercase tracking-wider">
                Top Survivors
              </h3>
            </div>
            <div className="space-y-3">
              {topAlive.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-warm-50 transition-all group border border-transparent hover:border-warm-200"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-ship-700 font-mono text-sm font-bold w-8 flex-shrink-0 bg-ship-50 py-1 px-2 rounded-md text-center">
                      {project.survivalScore}
                    </span>
                    <span className="text-warm-900 group-hover:text-ship-700 transition-colors truncate font-medium">
                      {project.name}
                    </span>
                    <span className="text-warm-400 text-xs font-mono flex-shrink-0 hidden sm:inline-block px-2 py-0.5 rounded-full bg-warm-100/50">
                      {project.category}
                    </span>
                  </div>
                  <ScoreBar score={project.survivalScore} />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-warm-50/50 rounded-2xl p-6 border border-warm-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-warm-200">
              <div className="w-2 h-2 rounded-full bg-skip-500" />
              <h3 className="text-sm font-bold text-skip-800 uppercase tracking-wider">
                Project Graveyard
              </h3>
            </div>
            <div className="space-y-3">
              {topDead.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white transition-all group border border-transparent hover:border-warm-200 hover:shadow-warm-sm"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-skip-700 font-mono text-sm font-bold w-8 flex-shrink-0 bg-skip-50 py-1 px-2 rounded-md text-center">
                      {project.survivalScore}
                    </span>
                    <span className="text-warm-500 group-hover:text-skip-700 transition-colors line-through truncate decoration-skip-300">
                      {project.name}
                    </span>
                  </div>
                  <ScoreBar score={project.survivalScore} inverse />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
