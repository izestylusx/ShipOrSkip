
import { ValidationTrendAnalysis } from "./types";

interface TrendAnalysisPanelProps {
    trend?: ValidationTrendAnalysis;
}

function trendColor(trend: ValidationTrendAnalysis["categoryTrend"]) {
    switch (trend) {
        case "rising":
            return "text-ship-700";
        case "stable":
            return "text-wait-700";
        case "declining":
            return "text-skip-700";
    }
}

function buzzColor(level: ValidationTrendAnalysis["buzzLevel"]) {
    switch (level) {
        case "high":
            return "text-ship-700";
        case "moderate":
            return "text-wait-700";
        case "low":
        case "none":
            return "text-warm-600";
    }
}

export default function TrendAnalysisPanel({ trend }: TrendAnalysisPanelProps) {
    if (!trend) return null;

    const topicTweets = trend.topicTweets ?? [];

    return (
        <div className="p-4 bg-white border border-warm-300 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-warm-600 uppercase tracking-wider">
                    Real-time Trend Analysis (X/Twitter)
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-warm-600">Momentum:</span>
                        <span className={`font-medium ${trendColor(trend.categoryTrend)} uppercase`}>
                            {trend.categoryTrend}
                        </span>
                    </div>
                    <div className="w-px h-3 bg-warm-300" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-warm-600">Buzz:</span>
                        <span className={`font-medium ${buzzColor(trend.buzzLevel)} uppercase`}>
                            {trend.buzzLevel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-xs text-warm-600 mb-1">Current Narrative</p>
                        <p className="text-sm text-warm-800 leading-relaxed">
                            {trend.narrative || "No clear narrative detected."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {trend.risingKeywords.length > 0 && (
                            <div>
                                <p className="text-xs text-warm-600 mb-1.5">Rising Topics</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {trend.risingKeywords.map((kw) => (
                                        <span
                                            key={kw}
                                            className="text-xs font-mono text-ship-700 bg-ship-50 border border-ship-200 px-1.5 py-0.5 rounded"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {trend.decliningKeywords.length > 0 && (
                            <div>
                                <p className="text-xs text-warm-600 mb-1.5">Fading Topics</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {trend.decliningKeywords.map((kw) => (
                                        <span
                                            key={kw}
                                            className="text-xs font-mono text-warm-600 bg-warm-200 border border-warm-300 px-1.5 py-0.5 rounded"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center p-3 bg-warm-100 rounded-lg border border-warm-300 w-24">
                    <span className="text-xs text-warm-600 font-mono uppercase tracking-wide mb-1">
                        Trend Score
                    </span>
                    <span className="text-2xl font-bold text-warm-900 font-mono">
                        {trend.trendScore}
                    </span>
                    <div className="w-full h-1 bg-warm-300 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-ship-500 rounded-full"
                            style={{ width: `${trend.trendScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {trend.timingVerdict && (
                <div className="bg-warm-200 rounded-lg p-3 border border-warm-300">
                    <p className="text-xs text-warm-600 mb-1">Timing Verdict</p>
                    <p className="text-xs text-warm-700 italic">
                        &ldquo;{trend.timingVerdict}&rdquo;
                    </p>
                </div>
            )}

            {/* ---- Topic Buzz: community tweets about this idea's theme ---- */}
            {topicTweets.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-warm-600 font-mono uppercase tracking-wider">
                        Community Buzz on X
                    </p>
                    <div className="space-y-2">
                        {topicTweets.map((tweet, i) => (
                            <div
                                key={`${tweet.author}-${i}`}
                                className="rounded-lg border border-warm-300 bg-warm-100 p-3"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <span className="inline-flex items-center justify-center w-5 h-5 bg-data-100 border border-data-300 rounded-full">
                                            <svg className="w-3 h-3 text-data-600" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-data-700">
                                            {tweet.author}
                                        </span>
                                        <p className="text-xs text-warm-800 mt-0.5 leading-relaxed">
                                            &ldquo;{tweet.text}&rdquo;
                                        </p>
                                        {tweet.context && (
                                            <p className="text-xs text-warm-500 mt-1 italic">
                                                {tweet.context}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
