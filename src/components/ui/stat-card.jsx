import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * StatCard — shared summary stat card.
 * Soft tinted card with a colored gradient icon tile, label, big bold value
 * and a small sub-label. Reusable across Dashboard / Users / Job Sheets.
 */
const TONES = {
  indigo: "from-indigo-500 to-violet-500",
  emerald: "from-emerald-500 to-teal-500",
  orange: "from-orange-500 to-amber-500",
  pink: "from-pink-500 to-rose-500",
};

export function StatCard({ icon: Icon, label, value, sublabel, tone = "indigo", className }) {
  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-muted/40 to-transparent" />
      <div className="relative flex items-center gap-4">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            TONES[tone] || TONES.indigo
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold leading-tight text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;