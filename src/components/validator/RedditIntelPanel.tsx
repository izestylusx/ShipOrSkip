"use client";

import type { RedditCommunityIntel } from "./types";

interface RedditIntelPanelProps {
  redditIntel?: RedditCommunityIntel;
}

function buzzColor(buzz: string): string {
  switch (buzz) {
    case "high": return "text-ship-700 bg-ship-50 border-ship-200";
    case "moderate": return "text-wait-700 bg-wait-50 border-wait-200";
    case "low": return "text-warm-600 bg-warm-100 border-warm-300";
    case "none": return "text-skip-700 bg-skip-50 border-skip-200";
    default: return "text-warm-600 bg-warm-100 border-warm-300";
  }
}

function sentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case "positive": return "text-ship-700 bg-ship-50 border-ship-200";
    case "negative": return "text-skip-700 bg-skip-50 border-skip-200";
    case "mixed": return "text-wait-700 bg-wait-50 border-wait-200";
    default: return "text-warm-600 bg-warm-100 border-warm-300";
  }
}

export default function RedditIntelPanel({ redditIntel }: RedditIntelPanelProps) {
  if (!redditIntel) {
    return (
      <div className="p-4 bg-white border border-warm-300 rounded-xl space-y-3">
        <h3 className="text-sm font-mono text-warm-600 uppercase tracking-wider">
          Reddit Community Intel
        </h3>
        <p className="text-xs text-warm-500 italic">No Reddit data available for this idea.</p>
      </div>
    );
  }

  const { communityBuzz, relevantThreads, sentimentBreakdown, keyInsights } = redditIntel;
  const total = sentimentBreakdown.positive + sentimentBreakdown.negative + sentimentBreakdown.neutral;
  const posW = total > 0 ? Math.round((sentimentBreakdown.positive / total) * 100) : 0;
  const negW = total > 0 ? Math.round((sentimentBreakdown.negative / total) * 100) : 0;
  const neuW = total > 0 ? 100 - posW - negW : 0;

  // Show at most 3 threads to keep it compact
  const threadsToShow = relevantThreads.slice(0, 3);

  return (
    <div className="p-4 bg-white border border-warm-300 rounded-xl space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-warm-600 uppercase tracking-wider flex items-center gap-2">
          {/* Reddit alien icon */}
          <svg className="w-4 h-4 text-warm-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
          Reddit Community Intel
        </h3>
        <span className={`text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${buzzColor(communityBuzz)}`}>
          {communityBuzz} buzz
        </span>
      </div>

      {/* Sentiment breakdown bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-warm-600 font-mono uppercase tracking-wider">Sentiment</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {posW > 0 && (
              <div className="bg-ship-400 rounded-l-full" style={{ width: `${posW}%` }} />
            )}
            {neuW > 0 && (
              <div className="bg-warm-400" style={{ width: `${neuW}%` }} />
            )}
            {negW > 0 && (
              <div className="bg-skip-400 rounded-r-full" style={{ width: `${negW}%` }} />
            )}
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-ship-600">{posW}% positive</span>
            <span className="text-warm-500">{neuW}% neutral</span>
            <span className="text-skip-600">{negW}% negative</span>
          </div>
        </div>
      )}

      {/* Key insights */}
      {keyInsights.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-warm-600 font-mono uppercase tracking-wider">Key Insights</p>
          <ul className="space-y-1">
            {keyInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-warm-800">
                <span className="mt-0.5 text-warm-400 flex-shrink-0">›</span>
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Thread cards */}
      {threadsToShow.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-warm-600 font-mono uppercase tracking-wider">
            Top Threads ({relevantThreads.length} found)
          </p>
          <div className="space-y-2">
            {threadsToShow.map((thread, i) => (
              <div
                key={i}
                className="rounded-lg border border-warm-300 bg-warm-100 p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-data-700 bg-data-50 border border-data-200 px-1.5 py-0.5 rounded">
                      r/{thread.subreddit}
                    </span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${sentimentColor(thread.sentiment)}`}>
                      {thread.sentiment}
                    </span>
                  </div>
                </div>
                <a
                  href={thread.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs font-medium text-warm-900 hover:text-ship-600 transition-colors leading-snug"
                >
                  {thread.title}
                </a>
                {thread.summary && (
                  <p className="text-xs text-warm-600 leading-relaxed">
                    {thread.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
