/**
 * Returns a Tailwind text color class based on a numeric score.
 * ≥ 60 → ship (green), ≥ 35 → wait (amber), < 35 → skip (red).
 */
export function scoreColor(value: number): string {
  if (value >= 60) return "text-ship-700";
  if (value >= 35) return "text-wait-700";
  return "text-skip-700";
}

/**
 * Returns a Tailwind background color class for progress bars.
 */
export function barColor(value: number): string {
  if (value >= 60) return "bg-ship-500";
  if (value >= 35) return "bg-wait-500";
  return "bg-skip-500";
}
