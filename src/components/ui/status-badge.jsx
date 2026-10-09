import { cn } from "@/lib/utils";

/**
 * StatusBadge — soft pill badge with a subtle ring border.
 * Reusable for statuses, roles, tags across the app.
 * Tones map to soft corporate tints (green = success, grey = neutral, etc.).
 */
const TONES = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  navy: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function StatusBadge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export default StatusBadge;