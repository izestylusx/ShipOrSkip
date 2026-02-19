export default function SkeletonCard() {
  return (
    <div className="p-4 bg-white border border-warm-100 rounded-xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-warm-100 rounded" />
          <div className="h-3 w-20 bg-warm-100 rounded" />
        </div>
        <div className="h-10 w-10 bg-warm-100 rounded-lg" />
      </div>

      <div className="h-5 w-16 bg-warm-100 rounded-full mb-3" />

      <div className="grid grid-cols-3 gap-1">
        <div className="h-6 bg-warm-100 rounded" />
        <div className="h-6 bg-warm-100 rounded" />
        <div className="h-6 bg-warm-100 rounded" />
      </div>
    </div>
  );
}
