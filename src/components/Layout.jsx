import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Package, ClipboardList, BarChart3,
  LogOut, Building2, Users, ChevronDown, UserCog,
  Bell, Undo2, CheckSquare, FileText, Settings
} from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import AccessDenied from "@/pages/AccessDenied";
import { normalizeRole } from "@/lib/roles";
import { getGsiUser } from "@/lib/gsiUser";

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

export default function Layout() {
  const [gsiUser] = useState(() => getGsiUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  // Wrapped in useCallback so the interval/effect always reference the
  // current version, even if this function later starts reading state/props.
  const runActiveCheck = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("checkActive", {});
      if (res.data?.valid === false) {
        setDenied(true);
      }
    } catch {
      // transient network error — fail open
    }
  }, []);

  // Re-check on every navigation
  useEffect(() => {
    runActiveCheck();
  }, [location.pathname, runActiveCheck]);

  // And every 60s while the app is open
  useEffect(() => {
    const interval = setInterval(runActiveCheck, 60_000);
    return () => clearInterval(interval);
  }, [runActiveCheck]);

  // Close profile dropdown on outside click (desktop)
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const role = normalizeRole(gsiUser?.role);
  const navItems = NAV_BY_ROLE[role];

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    base44.auth.logout("/");
  };

  const initials = gsiUser?.username
    ? gsiUser.username.slice(0, 2).toUpperCase()
    : "U";

  if (denied || !navItems) return <AccessDenied />;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[hsl(217,91%,22%)] text-white shadow-lg safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-300 flex-shrink-0" />
            <span className="font-bold text-sm tracking-tight leading-tight">GSI Stock Management</span>
          </div>

          {/* Right side: Notification Bell + Profile */}
          <div className="flex items-center gap-1">
            {/* Notification Bell — visible on all screen sizes */}
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-blue-200" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            </button>

            {/* Desktop profile dropdown */}
            <div className="relative hidden md:block" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium leading-none">{gsiUser?.username || "User"}</p>
                <p className="text-xs text-blue-300 capitalize">{role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{gsiUser?.username || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {role}{gsiUser?.team ? ` · ${gsiUser.team}` : ""}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-border shadow-sm">
          <nav className="flex-1 p-3 space-y-1 pt-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{gsiUser?.username || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role} · {gsiUser?.team || ""}</p>
            </div>
          </div>
        </aside>

        {/* Main Content — extra bottom padding on mobile for the bottom nav */}
        <main
          className="flex-1 overflow-y-auto pb-[56px] md:pb-0"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav gsiUser={gsiUser} />
    </div>
  );
}