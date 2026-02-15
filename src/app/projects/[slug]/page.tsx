export default function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="min-h-screen bg-navy-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 capitalize">
          {params.slug.replace(/-/g, " ")}
        </h1>
        <p className="text-neutral-400 mb-8">Project detail view</p>
        <div className="text-neutral-500 text-center py-20 border border-dashed border-neutral-800 rounded-xl">
          Project detail coming soon...
        </div>
      </div>
    </main>
  );
}
