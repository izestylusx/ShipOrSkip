import type {
  CommunityStatsForUI,
  EcosystemIntelForUI,
} from "@/components/validator/types";

interface EcosystemIntelPanelProps {
  ecosystem?: EcosystemIntelForUI;
  community?: CommunityStatsForUI;
}

export default function EcosystemIntelPanel({ ecosystem, community }: EcosystemIntelPanelProps) {
  if (!ecosystem && !community) return null;

  return (
    <div className="p-4 bg-white border border-warm-200 rounded-xl space-y-4 h-full flex flex-col">
      <h3 className="text-sm font-mono text-warm-600 uppercase tracking-wider">
        Ecosystem Intelligence
      </h3>

      {/* Community Stats */}
      {community && community.totalValidations > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="bg-data-50 border border-data-200 rounded-lg px-3 py-2 text-center">
            <p className="text-data-700 font-mono text-lg font-bold">{community.totalValidations}</p>
            <p className="text-warm-600">Ideas Validated</p>
          </div>
          {community.similarIdeaCount > 0 && (
            <div className="bg-wait-50 border border-wait-200 rounded-lg px-3 py-2 text-center">
              <p className="text-wait-700 font-mono text-lg font-bold">{community.similarIdeaCount}</p>
              <p className="text-warm-600">Similar Ideas</p>
            </div>
          )}
          <div className="bg-warm-200 border border-warm-300 rounded-lg px-3 py-2 text-center">
            <p className="text-warm-800 font-mono text-lg font-bold">{community.avgPmfScore}</p>
            <p className="text-warm-600">Avg PMF Score</p>
          </div>
        </div>
      )}

      {/* Category Survival */}
      {ecosystem?.categorySurvival && (
        <div className="space-y-2">
          <p className="text-xs text-warm-600">
            {ecosystem.categorySurvival.category} Category Health
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-warm-300 rounded-full overflow-hidden flex">
              {ecosystem.categorySurvival.alive > 0 && (
                <div
                  className="h-full bg-ship-500"
                  style={{
                    width: `${(ecosystem.categorySurvival.alive / ecosystem.categorySurvival.total) * 100}%`,
                  }}
                />
              )}
              {ecosystem.categorySurvival.zombie > 0 && (
                <div
                  className="h-full bg-wait-500"
                  style={{
                    width: `${(ecosystem.categorySurvival.zombie / ecosystem.categorySurvival.total) * 100}%`,
                  }}
                />
              )}
              {ecosystem.categorySurvival.dead > 0 && (
                <div
                  className="h-full bg-skip-500"
                  style={{
                    width: `${(ecosystem.categorySurvival.dead / ecosystem.categorySurvival.total) * 100}%`,
                  }}
                />
              )}
            </div>
            <span
              className={`text-xs font-mono font-bold ${ecosystem.categorySurvival.survivalRate >= 50
                  ? "text-ship-400"
                  : ecosystem.categorySurvival.survivalRate >= 20
                    ? "text-wait-400"
                    : "text-skip-400"
                }`}
            >
              {ecosystem.categorySurvival.survivalRate}%
            </span>
          </div>
          <div className="flex gap-3 text-xs text-warm-600">
            <span>
              <span className="text-ship-700">{ecosystem.categorySurvival.alive}</span> alive
            </span>
            <span>
              <span className="text-wait-700">{ecosystem.categorySurvival.zombie}</span> zombie
            </span>
            <span>
              <span className="text-skip-700">{ecosystem.categorySurvival.dead}</span> dead
            </span>
          </div>
        </div>
      )}

      {/* Overall Survival */}
      {ecosystem && (
        <p className="text-xs text-warm-500 mt-auto">
          Overall BNB ecosystem survival rate: {ecosystem.overallSurvivalRate}% across all analyzed projects
        </p>
      )}
    </div>
  );
}
