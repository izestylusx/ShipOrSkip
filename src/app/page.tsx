import Link from "next/link";
import EvidenceSection from "@/components/home/EvidenceSection";
import StatsBar from "@/components/home/StatsBar";
import TrustStrip from "@/components/home/TrustStrip";
import { getProjects } from "@/lib/data";
import { getTotalValidationCount } from "@/lib/validation-store";

export const revalidate = 600;

export default async function Home() {
  const projects = await getProjects();
  const alive = projects.filter((project) => project.status === "alive").length;
  const zombie = projects.filter((project) => project.status === "zombie").length;
  const dead = projects.filter((project) => project.status === "dead").length;
  const total = projects.length;

  const topAlive = projects
    .filter((project) => project.status === "alive")
    .sort((left, right) => right.survivalScore - left.survivalScore)
    .slice(0, 5);

  const topDead = projects
    .filter((project) => project.status === "dead")
    .sort((left, right) => left.survivalScore - right.survivalScore)
    .slice(0, 3);

  const categoryCount = new Set(projects.map((project) => project.category)).size;
  const validatedCount = await getTotalValidationCount();

  return (
    <main className="min-h-screen bg-warm-50 selection:bg-ship-100 selection:text-ship-900">
      <section className="relative flex flex-col items-center justify-center min-h-[70vh] px-4 text-center pt-24 pb-20 overflow-hidden">
        {/* Abstract Warm Background Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-warm-200/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <p className="text-ship-800 font-mono text-xs tracking-[0.2em] uppercase font-bold bg-ship-100/50 px-3 py-1 rounded-full border border-ship-200/50 inline-block backdrop-blur-sm">
            BNB Ecosystem Intelligence
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-warm-900 tracking-tight text-balance leading-[1.05] drop-shadow-sm">
            Don&apos;t Ship Blind.
          </h1>
          <p className="text-xl md:text-2xl text-warm-600 max-w-2xl mx-auto text-balance leading-relaxed font-medium">
            Mapping the entire BNB Chain ecosystem. <span className="text-warm-900 font-semibold">{total} projects</span> scored &amp; growing.
          </p>

          <StatsBar total={total} alive={alive} zombie={zombie} dead={dead} validated={validatedCount} />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/validate"
              className="px-8 py-4 bg-ship-600 hover:bg-ship-700 text-white font-bold rounded-full shadow-warm-lg hover:shadow-warm-xl transition-all hover:-translate-y-0.5"
            >
              Validate Your Idea
            </Link>
            <Link
              href="/projects"
              className="px-8 py-4 border border-warm-300 hover:border-warm-400 bg-white hover:bg-warm-50 text-warm-900 font-semibold rounded-full shadow-warm-sm hover:shadow-warm-md transition-all"
            >
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <TrustStrip totalProjects={total} />
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-warm-900 mb-8 text-center tracking-tight">Ecosystem Snapshot</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              label="Survivors"
              value={alive}
              subtitle={`${Math.round((alive / Math.max(total, 1)) * 100)}% survival rate`}
              color="text-ship-700"
              bg="bg-ship-50/50"
              border="border-ship-100"
            />
            <StatCard
              label="Zombies"
              value={zombie}
              subtitle="Alive but struggling"
              color="text-wait-700"
              bg="bg-wait-50/50"
              border="border-wait-100"
            />
            <StatCard
              label="Dead"
              value={dead}
              subtitle="Lessons learned"
              color="text-skip-700"
              bg="bg-skip-50/50"
              border="border-skip-100"
            />
            <StatCard
              label="Categories"
              value={categoryCount}
              subtitle="DEX, Gaming, AI..."
              color="text-warm-800"
              bg="bg-warm-100/50"
              border="border-warm-200"
            />
          </div>
        </div>
      </section>

      <EvidenceSection topAlive={topAlive} topDead={topDead} />

      <section id="validate" className="py-24 px-4 border-t border-warm-200 bg-warm-50/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-warm-900 tracking-tight">Ready to Validate Your Idea?</h2>
          <p className="text-warm-600 max-w-xl mx-auto text-lg leading-relaxed">
            Get AI-powered intel backed by {total}+ scored BNB ecosystem projects. Trend analysis, competitor signals, and a builder-focused briefing in seconds.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
            <div className="bg-white border border-warm-200 rounded-2xl p-4 shadow-warm-sm">
              <p className="text-ship-700 font-mono text-2xl font-bold">7</p>
              <p className="text-warm-500 text-xs font-semibold uppercase tracking-wide mt-1">Sources</p>
            </div>
            <div className="bg-white border border-warm-200 rounded-2xl p-4 shadow-warm-sm">
              <p className="text-warm-900 font-mono text-2xl font-bold">~4s</p>
              <p className="text-warm-500 text-xs font-semibold uppercase tracking-wide mt-1">Avg Time</p>
            </div>
            <div className="bg-white border border-warm-200 rounded-2xl p-4 shadow-warm-sm">
              <p className="text-wait-700 font-mono text-2xl font-bold">{total}+</p>
              <p className="text-warm-500 text-xs font-semibold uppercase tracking-wide mt-1">Projects</p>
            </div>
          </div>
          <div className="pt-4">
            <Link
              href="/validate"
              className="inline-flex items-center gap-2 px-10 py-4 bg-ship-600 hover:bg-ship-700 text-white font-semibold rounded-full transition-all shadow-warm-lg hover:shadow-warm-xl hover:-translate-y-1 text-lg"
            >
              Start Validation →
            </Link>
          </div>
        </div>
      </section>

      <Link
        href="/validate"
        className="md:hidden fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-ship-600 hover:bg-ship-700 text-white text-sm font-bold shadow-warm-xl border border-ship-500/50"
      >
        Validate
      </Link>
    </main>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
  bg = "bg-white",
  border = "border-warm-200"
}: {
  label: string;
  value: number;
  subtitle: string;
  color: string;
  bg?: string;
  border?: string;
}) {
  return (
    <div className={`group ${bg} border ${border} rounded-2xl p-6 text-center transition-all hover:shadow-warm-md hover:-translate-y-1`}>
      <p className={`text-4xl font-bold font-mono ${color} tracking-tighter`}>{value}</p>
      <p className="text-warm-900 text-sm font-bold mt-2 uppercase tracking-wide">{label}</p>
      <p className="text-warm-500 text-xs mt-1 font-medium">{subtitle}</p>
    </div>
  );
}
