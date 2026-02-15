export default function Home() {
  return (
    <main className="min-h-screen bg-navy-950">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-ship-400 font-mono text-sm tracking-wider uppercase">
            BNB Ecosystem Intelligence
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight text-balance">
            Don&apos;t Ship Blind.
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto text-balance">
            Know what happened when others built the same thing.
            50+ BSC projects analyzed. AI-powered idea validation.
          </p>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 text-sm font-mono text-neutral-500 pt-4">
            <span>
              <span className="text-white font-semibold">50+</span> analyzed
            </span>
            <span className="text-neutral-700">|</span>
            <span>
              <span className="text-skip-400 font-semibold">60%</span> dead
            </span>
            <span className="text-neutral-700">|</span>
            <span>
              <span className="text-ship-400 font-semibold">AI</span>-powered
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a
              href="/validate"
              className="px-8 py-3 bg-ship-500 hover:bg-ship-600 text-white font-semibold rounded-lg transition-colors"
            >
              Validate Your Idea
            </a>
            <a
              href="/projects"
              className="px-8 py-3 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-semibold rounded-lg transition-colors"
            >
              Explore Projects
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
