import { ProjectData } from "@/types";

interface MetricsTableProps {
  token: ProjectData["token"];
  contract: ProjectData["contract"];
}

function formatMarketCap(value: number | null | undefined): string {
  if (!value) return "N/A";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatVolume(value: number | null | undefined): string {
  if (!value) return "N/A";
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 bg-white border border-warm-300 rounded-lg">
      <p className="text-[11px] text-warm-600 font-mono">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color ?? "text-warm-900"}`}>{value}</p>
    </div>
  );
}

export default function MetricsTable({ token, contract }: MetricsTableProps) {
  return (
    <>
      {token && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-3">Token Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Market Cap" value={formatMarketCap(token.marketCap)} />
            <StatBox
              label="Price"
              value={`$${token.price?.toFixed(token.price < 0.01 ? 6 : 4) ?? "N/A"}`}
            />
            <StatBox
              label="24h Change"
              value={formatPercent(token.priceChange24h)}
              color={
                token.priceChange24h > 0
                  ? "text-ship-700"
                  : token.priceChange24h < 0
                  ? "text-skip-700"
                  : undefined
              }
            />
            <StatBox label="24h Volume" value={formatVolume(token.volume24h)} />
            <StatBox label="Liquidity" value={formatVolume(token.liquidity)} />
            <StatBox label="FDV" value={formatMarketCap(token.fdv)} />
            <StatBox label="ATH Drop" value={formatPercent(token.athChangePercent)} color="text-skip-700" />
            <StatBox
              label="30d Change"
              value={formatPercent(token.priceChange30d)}
              color={(token.priceChange30d ?? 0) > 0 ? "text-ship-700" : "text-skip-700"}
            />
          </div>
        </section>
      )}

      {contract && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900 mb-3">Contract Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              label="Verified"
              value={
                contract.verified === null ? "Unknown" : contract.verified ? "Yes" : "No"
              }
            />
            <StatBox
              label="Ownership"
              value={
                contract.ownershipRenounced === null
                  ? "Unknown"
                  : contract.ownershipRenounced
                  ? "Renounced"
                  : "Not Renounced"
              }
            />
            <StatBox
              label="Wallets (30d)"
              value={
                contract.uniqueWallets30d > 0
                  ? contract.uniqueWallets30d.toLocaleString()
                  : "N/A"
              }
            />
            <StatBox
              label="First TX"
              value={
                contract.firstTxDate ? new Date(contract.firstTxDate).toLocaleDateString() : "N/A"
              }
            />
          </div>
        </section>
      )}
    </>
  );
}
