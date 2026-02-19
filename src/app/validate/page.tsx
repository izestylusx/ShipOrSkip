import ValidatorForm from "@/components/ValidatorForm";
import { getProjects } from "@/lib/data";

export default async function ValidatePage() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-warm-100 px-4 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-warm-900 tracking-tight mb-4">
            Idea Validator
          </h1>
          <p className="text-lg text-warm-700 max-w-2xl mx-auto leading-relaxed">
            Describe your BNB Chain project and get AI-powered intel backed by {projects.length}+ scored ecosystem projects.
          </p>
        </div>
        <ValidatorForm />
      </div>
    </main>
  );
}
