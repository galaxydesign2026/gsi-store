// Canonical business role strings (must match userdetails.role in Supabase).
export const ROLES = [
  "supervisor",
  "project_executive",
  "team_manager",
  "team_admin",
  "store_admin",
  "director",
];

// Normalize a role string coming from Supabase / localStorage into the
// canonical underscore form used by NAV_BY_ROLE and the route guards.
export function normalizeRole(role) {
  return (role || "").toLowerCase().trim().replace(/\s+/g, "_");
}