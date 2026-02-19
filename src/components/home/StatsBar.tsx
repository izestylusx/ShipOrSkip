"use client";

import { useEffect, useState } from "react";

interface StatsBarProps {
  total: number;
  alive: number;
  zombie: number;
  dead: number;
  validated?: number;
}

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(1, Math.floor(durationMs / 16));
    const timer = setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      setValue(Math.round(target * progress));
      if (progress >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [target, durationMs]);

  return value;
}

export default function StatsBar({ total, alive, zombie, dead, validated = 0 }: StatsBarProps) {
  const totalDisplay = useCountUp(total);
  const aliveDisplay = useCountUp(alive);
  const zombieDisplay = useCountUp(zombie);
  const deadDisplay = useCountUp(dead);
  const validatedDisplay = useCountUp(validated);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-mono text-warm-700 pt-6">
      <span>
        <span className="text-warm-900 font-bold text-base">{totalDisplay}</span> scored
      </span>
      <span className="hidden sm:inline text-warm-400">/</span>
      <span>
        <span className="text-ship-700 font-bold text-base">{aliveDisplay}</span> alive
      </span>
      <span className="hidden sm:inline text-warm-400">/</span>
      <span>
        <span className="text-wait-700 font-bold text-base">{zombieDisplay}</span> zombie
      </span>
      <span className="hidden sm:inline text-warm-400">/</span>
      <span>
        <span className="text-skip-700 font-bold text-base">{deadDisplay}</span> dead
      </span>
      {validated > 0 && (
        <>
          <span className="hidden sm:inline text-warm-400">/</span>
          <span>
            <span className="text-data-700 font-bold text-base">{validatedDisplay}</span> validated
          </span>
        </>
      )}
    </div>
  );
}
