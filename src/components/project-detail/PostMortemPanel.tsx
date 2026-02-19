import { AliveSummary, PostMortemReport } from "@/types";

interface PostMortemPanelProps {
  postMortem: PostMortemReport | null;
  aliveSummary: AliveSummary | null;
}

function DetailField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-warm-600 font-mono mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "text-warm-900 font-medium" : "text-warm-700"}`}>
        {value}
      </p>
    </div>
  );
}

export default function PostMortemPanel({ postMortem, aliveSummary }: PostMortemPanelProps) {
  if (!postMortem && !aliveSummary) return null;

  return (
    <>
      {postMortem && (
        <section className="mb-8 p-5 bg-skip-500/5 border border-skip-500/15 rounded-xl">
          <h2 className="text-lg font-semibold text-skip-700 mb-4">Post-Mortem Analysis</h2>
          <div className="space-y-3">
            <DetailField label="What Happened" value={postMortem.whatHappened} />
            <DetailField label="Death Pattern" value={postMortem.deathPattern} />
            <DetailField label="Root Cause" value={postMortem.rootCause} />
            <DetailField label="Timeline" value={postMortem.timeline} />
            <DetailField label="Lesson for Builders" value={postMortem.lessonForBuilders} highlight />
            <DetailField
              label="Would This Category Work Today?"
              value={postMortem.wouldCategoryWorkToday}
            />
          </div>
        </section>
      )}

      {aliveSummary && (
        <section className="mb-8 p-5 bg-ship-500/5 border border-ship-500/15 rounded-xl">
          <h2 className="text-lg font-semibold text-ship-700 mb-4">Survival Analysis</h2>
          <div className="space-y-3">
            <DetailField label="Why It Survives" value={aliveSummary.whyItSurvives} />
            <DetailField
              label="Key Differentiator"
              value={aliveSummary.keyDifferentiator}
              highlight
            />
            <DetailField label="Risk Factors" value={aliveSummary.riskFactors} />
            <DetailField label="Builder Takeaway" value={aliveSummary.builderTakeaway} highlight />
          </div>
        </section>
      )}
    </>
  );
}
