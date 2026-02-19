import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink-800/50 bg-ink-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-ink-400 text-center sm:text-left">
            Built for <span className="text-wait-400">Good Vibes Only: OpenClaw Edition</span>
          </p>
          <div className="flex items-center gap-4 text-ink-500">
            <Link href="/projects" className="hover:text-ink-300 transition-colors">
              Explorer
            </Link>
            <Link href="/validate" className="hover:text-ink-300 transition-colors">
              Validate
            </Link>
          </div>
        </div>
        <p className="text-xs text-ink-500 mt-3 text-center sm:text-left">
          Data: DappBay, BSCScan, NodeReal, CoinGecko, DeFiLlama, X(Twitter)
        </p>
      </div>
    </footer>
  );
}
