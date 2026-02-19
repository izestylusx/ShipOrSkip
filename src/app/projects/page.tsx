import { getProjects } from "@/lib/data";
import ProjectGrid from "@/components/ProjectGrid";

export const revalidate = 600; // revalidate every 10 minutes

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-warm-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-warm-900 tracking-tight mb-4">
            Ecosystem Explorer
          </h1>
          <p className="text-lg text-warm-700 max-w-2xl mx-auto">
            {projects.length}+ BNB Chain projects scored & ranked. Filter by survival status, category, or market cap.
          </p>
        </div>
        <ProjectGrid projects={projects} />
      </div>
    </main>
  );
}
