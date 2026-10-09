export default function PageLoader() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2 mb-6">
        <div className="h-6 w-40 bg-muted rounded-lg" />
        <div className="h-4 w-56 bg-muted/60 rounded-lg" />
      </div>
      {/* Card skeletons */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border h-24" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border h-48" />
      <div className="bg-white rounded-2xl border border-border h-32" />
    </div>
  );
}