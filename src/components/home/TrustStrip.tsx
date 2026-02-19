interface TrustStripProps {
  totalProjects: number;
}

export default function TrustStrip({ totalProjects }: TrustStripProps) {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-3 rounded-xl border border-warm-300 bg-white/80 text-xs font-medium text-warm-700 shadow-sm">
        <p>⚡ {totalProjects}+ projects scored</p>
        <span className="hidden sm:block text-warm-300">•</span>
        <p>⏱️ Avg response ~4s</p>
        <span className="hidden sm:block text-warm-300">•</span>
        <p>🔍 7 data sources (onchain + social)</p>
      </div>
    </div>
  );
}
