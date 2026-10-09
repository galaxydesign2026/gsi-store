// =====================================================================
// Base44 compatibility layer (server side).
// The ported handlers were written for Base44 and call:
//   createClientFromRequest(req).auth.me()
//   createClientFromRequest(req).asServiceRole.entities.UserProfile.filter({ auth_user_id })
// This file provides the same shape, backed by:
//   - Supabase Auth  (verifies the caller's JWT; email must be confirmed)
//   - public.userdetails via isvaliduser / getuserdetails (role, team, username)
// Identity ALWAYS comes from the verified token on the server, never from the request body.
// Inactive users (isvaliduser = false) get NO profile -> handlers return 403.
// FastAPI later: replace with a JWT dependency that loads the same profile.
// =====================================================================
import { supabase } from "./supabaseClient.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

type AuthUser = { id: string; email: string; full_name: string };

async function verifyToken(req: Request): Promise<AuthUser | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  });
  if (!res.ok) return null;
  const u = await res.json();
  if (!u?.id || !u?.email || !u?.email_confirmed_at) return null;
  const email = String(u.email).toLowerCase();
  return { id: String(u.id), email, full_name: email };
}

async function loadProfile(email: string, authUserId: string) {
  const [valid, details] = await Promise.all([
    supabase.rpc("isvaliduser", { p_email: email }),
    supabase.rpc("getuserdetails", { p_email: email }),
  ]);
  const isValid = valid.data === true || (Array.isArray(valid.data) && valid.data[0]?.isvaliduser === true);
  const d = Array.isArray(details.data) ? details.data[0] : details.data;
  if (!isValid || !d) return null;
  return {
    id: String(d.id),
    auth_user_id: authUserId,
    email,
    user_id: d.id,
    username: d.username,
    role: d.role,
    team: d.team || null,
    employee_id: d.employeeid,
  };
}

export function createClientFromRequest(req: Request) {
  let cachedUser: Promise<AuthUser | null> | null = null;
  const me = () => (cachedUser ??= verifyToken(req));

  const UserProfile = {
    async filter(query: Record<string, unknown>) {
      const user = await me();
      if (!user) return [];
      if ("auth_user_id" in query) {
        if (String(query.auth_user_id) !== user.id) return [];
        const p = await loadProfile(user.email, user.id);
        return p ? [p] : [];
      }
      if ("email" in query) {
        const email = String(query.email || "").toLowerCase();
        const p = await loadProfile(email, email === user.email ? user.id : "");
        return p ? [p] : [];
      }
      return [];
    },
    // Base44 kept a profile cache; Supabase userdetails is the source of truth, so these are no-ops.
    async create(data: Record<string, unknown>) { return { id: "noop", ...data }; },
    async update(_id: string, data: Record<string, unknown>) { return { id: _id, ...data }; },
  };

  return {
    auth: {
      async me() {
        return await me(); // null when not signed in / not verified -> handlers return 401
      },
    },
    asServiceRole: { entities: { UserProfile } },
  };
}
