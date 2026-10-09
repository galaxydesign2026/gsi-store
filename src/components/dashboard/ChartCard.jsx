export default function ChartCard({ title, subtitle, children }) {
  return <div className="min-w-0 bg-white rounded-2xl border border-border shadow-sm p-5">
    <div className="mb-5"><h3 className="text-base font-bold text-foreground">{title}</h3>{subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}</div>
    {children}
  </div>;
}