interface LoadingTheaterProps {
  stages: string[];
  currentStage: number;
  projectHint: string;
}

export default function LoadingTheater({
  stages,
  currentStage,
  projectHint,
}: LoadingTheaterProps) {
  return (
    <div className="p-6 bg-white border border-warm-300 rounded-xl animate-pulse">
      <p className="text-xs text-warm-600 mb-3">{projectHint}</p>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className={`flex items-center gap-3 transition-opacity duration-500 ${
              index <= currentStage ? "opacity-100" : "opacity-20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                index < currentStage
                  ? "bg-ship-500"
                  : index === currentStage
                  ? "bg-wait-500 animate-pulse"
                  : "bg-warm-400"
              }`}
            />
            <span className={index <= currentStage ? "text-warm-800 text-sm" : "text-warm-500 text-sm"}>
              {stage}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 h-1 bg-warm-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-ship-500 rounded-full transition-all duration-1000"
          style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
