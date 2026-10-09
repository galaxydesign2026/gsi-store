import {
  Briefcase,
  HardHat,
  Users,
  ShieldCheck,
  Store,
  Crown,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeRole } from "@/lib/roles";

/**
 * RolePill — soft pill badge with a small role icon + per-role tint.
 * Shared across screens that list users.
 */
const ROLE_META = {
  project_executive: { label: "Project Executive", icon: Briefcase, tone: "blue" },
  supervisor: { label: "Supervisor", icon: HardHat, tone: "green" },
  team_manager: { label: "Team Manager", icon: Users, tone: "orange" },
  team_admin: { label: "Team Admin", icon: ShieldCheck, tone: "pink" },
  store_admin: { label: "Store Admin", icon: Store, tone: "teal" },
  director: { label: "Director", icon: Crown, tone: "purple" },
  operations_manager: { label: "Operations Manager", icon: Settings, tone: "slate" },
};

const TONES = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  pink: "bg-pink-50 text-pink-700 ring-pink-600/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function RolePill({ role, className }) {
  const key = normalizeRole(role);
  const meta = ROLE_META[key] || { label: role, icon: Users, tone: "slate" };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONES[meta.tone] || TONES.slate,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export default RolePill;