import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Package, ClipboardList, BarChart3,
  Users, UserCircle, LogOut, X, UserCog,
  Undo2, CheckSquare, FileText, Settings
} from "lucide-react";
import { normalizeRole } from "@/lib/roles";

const NAV_BY_ROLE = {
  supervisor: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Items", icon: Package, path: "/items" },
    { label: "Requests", icon: ClipboardList, path: "/my-requests" },
    { label: "Returns", icon: Undo2, path: "/returns" },
  ],
  project_executive: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Approvals", icon: CheckSquare, path: "/approvals" },
    { label: "Returns", icon: Undo2, path: "/returns" },
  ],
  team_manager: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Approvals", icon: CheckSquare, path: "/approvals" },
    { label: "Returns", icon: Undo2, path: "/returns" },
    { label: "Users", icon: UserCog, path: "/users" },
  ],
  team_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Job Sheets", icon: FileText, path: "/job-sheets" },
    { label: "Users", icon: UserCog, path: "/users" },
  ],
  store_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Requests", icon: ClipboardList, path: "/requests" },
    { label: "Returns", icon: Undo2, path: "/returns" },
    { label: "Inventory", icon: Package, path: "/inventory" },
  ],
  director: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Approvals", icon: CheckSquare, path: "/approvals" },
    { label: "Reports", icon: BarChart3, path: "/reports" },
    { label: "Users", icon: UserCog, path: "/users" },
    { label: "Admin", icon: Settings, path: "/admin" },
  ],
};

export default function MobileBottomNav({ gsiUser }) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const role = normalizeRole(gsiUser?.role);
  const navItems = NAV_BY_ROLE[role] || [];
  const initials = gsiUser?.username ? gsiUser.username.slice(0, 2).toUpperCase() : "U";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    base44.auth.logout("/");
  };

  return (
    <>
      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)] safe-bottom md:hidden">
        <div className="flex items-stretch">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center min-h-[56px] py-1 gap-0.5 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-6 h-6 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                <span className={`text-[10px] font-medium leading-tight ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Profile Tab */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center min-h-[56px] py-1 gap-0.5 text-muted-foreground"
          >
            <UserCircle className="w-6 h-6 stroke-[1.8]" />
            <span className="text-[10px] font-medium leading-tight">Profile</span>
          </button>
        </div>
      </nav>

      {/* Profile Bottom Sheet */}
      {profileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setProfileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Close */}
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 right-4 p-2 rounded-full hover:bg-accent"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Avatar + Info */}
            <div className="flex flex-col items-center pt-4 pb-6 px-6">
              <div className="w-16 h-16 rounded-full bg-[hsl(217,91%,22%)] flex items-center justify-center text-2xl font-bold text-white mb-3">
                {initials}
              </div>
              <p className="text-lg font-bold text-foreground">{gsiUser?.username || "User"}</p>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{role}</p>
              {gsiUser?.team && (
                <p className="text-sm text-muted-foreground mt-0.5">{gsiUser.team}</p>
              )}
              {gsiUser?.employeeId && (
                <p className="text-xs text-muted-foreground/70 mt-1">ID: {gsiUser.employeeId}</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border mx-6" />

            {/* Sign Out */}
            <div className="p-4 pb-8 safe-bottom">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm active:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}