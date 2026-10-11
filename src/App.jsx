import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Reports from './pages/Reports';
import Items from './pages/Items';
import MyRequests from './pages/MyRequests';
import UsersPage from './pages/Users';
import AccessDenied from './pages/AccessDenied';
import PlaceholderPage from './pages/PlaceholderPage';
import RoleRoute from './components/RoleRoute';
import JobSheetForm from './pages/JobSheetForm';
import JobSheets from './pages/JobSheets';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Approvals from '@/pages/Approvals';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(217,91%,18%)] to-[hsl(215,60%,32%)]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
      <p className="text-white/70 text-sm">Loading…</p>
    </div>
  </div>
);

function AppRoutes() {

  // loading | denied | ready
  const [appState, setAppState] = useState('loading');
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      // Authenticate
      let me = null;
      try {
        me = await base44.auth.me();
      } catch {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (!me?.id) {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Validate against PostgreSQL and sync UserProfile cache
      const res = await base44.functions.invoke('validateUser', {});
      const { valid, profile } = res.data || {};

      if (!valid) {
        setAppState('denied');
        return;
      }

      // Use profile data returned directly from PostgreSQL (master source of truth)
      localStorage.setItem("gsiUser", JSON.stringify({
        userId: profile?.userId || null,
        employeeId: profile?.employeeId || null,
        username: profile?.username || me.full_name || me.email,
        role: profile?.role || null,
        team: profile?.team || null,
      }));
      localStorage.removeItem("n8nUser");

      setAppState('ready');
    };

    init().catch((err) => {
      console.error("APP INIT ERROR:", err);
      base44.auth.redirectToLogin(window.location.href);
    });

  }, []);

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <Routes>

      {appState === 'denied' ? (
        <Route path="*" element={<AccessDenied />} />
      ) : (
        <>
          {/* Default route */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<RoleRoute allowedRoles={["store_admin", "director", "team_manager"]}><Inventory /></RoleRoute>} />
            <Route path="/requests" element={<RoleRoute allowedRoles={["store_admin"]}><Requests /></RoleRoute>} />
            <Route path="/reports" element={<RoleRoute allowedRoles={["director"]}><Reports /></RoleRoute>} />
            <Route path="/items" element={<RoleRoute allowedRoles={["supervisor"]}><Items /></RoleRoute>} />
            <Route path="/my-requests" element={<RoleRoute allowedRoles={["supervisor"]}><MyRequests /></RoleRoute>} />
            <Route path="/users" element={<RoleRoute allowedRoles={["team_admin","team_manager","director"]}><UsersPage /></RoleRoute>} />
            <Route path="/returns" element={<RoleRoute allowedRoles={["supervisor","project_executive","team_manager","store_admin"]}><PlaceholderPage title="Returns" /></RoleRoute>} />
            <Route path="/approvals" element={<RoleRoute allowedRoles={["project_executive","team_manager","director"]}><Approvals /></RoleRoute>} />
            <Route path="/job-sheets" element={<RoleRoute allowedRoles={["team_admin"]}><JobSheets /></RoleRoute>} />
            <Route path="/jobsheets/new" element={<RoleRoute allowedRoles={["team_admin"]}><JobSheetForm /></RoleRoute>} />
            <Route path="/jobsheets/edit/:id" element={<RoleRoute allowedRoles={["team_admin"]}><JobSheetForm /></RoleRoute>} />
            <Route path="/admin" element={<RoleRoute allowedRoles={["director"]}><PlaceholderPage title="Admin" /></RoleRoute>} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </>
      )}

    </Routes>
  );
}

// Public auth pages render without the signed-in app shell.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
function Root() {
  const { pathname } = useLocation();
  if (PUBLIC_PATHS.includes(pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }
  return <AppRoutes />;
}

function App() {

  return (
    <Router>
      <QueryClientProvider client={queryClientInstance}>
        <Root />
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </Router>
  );
}

export default App;