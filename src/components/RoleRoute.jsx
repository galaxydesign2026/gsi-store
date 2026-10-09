import { Navigate } from "react-router-dom";
import { normalizeRole } from "@/lib/roles";
import { getGsiUser } from "@/lib/gsiUser";

// Guards a route so only the listed business roles may open it.
// Unauthorized roles are redirected to their own dashboard.
export default function RoleRoute({ allowedRoles, children }) {
  const gsiUser = getGsiUser();
  const role = normalizeRole(gsiUser?.role);
  console.log('RoleRoute check', {
    rawRole: gsiUser?.role,
    normalized: normalizeRole(gsiUser?.role),
    allowedRoles,
  });
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}