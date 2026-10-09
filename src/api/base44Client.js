// =====================================================================
// Base44 compatibility shim (frontend).
// The pages still call base44.functions.invoke(name, payload) and base44.auth.*
// exactly as before; this file routes those calls to:
//   - Supabase Edge Function "store-api"  (business logic, service key stays on the server)
//   - Supabase Auth via src/lib/auth.js   (login / logout)
// Error shape is unchanged: non-2xx throws an Error with error.response = { status, data }.
// FastAPI later: point API_URL at the FastAPI endpoint; nothing else changes.
// =====================================================================
import * as auth from "@/lib/auth";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "")}/functions/v1/store-api`;

async function invoke(fn, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: await auth.getRequestHeaders(),
    body: JSON.stringify({ fn, payload }),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.response = { status: res.status, data: data && typeof data === "object" ? data : { error: message } };
    throw error;
  }
  return { data };
}

export const base44 = {
  functions: { invoke },
  auth: {
    async me() {
      const user = await auth.getCurrentUser();
      if (!user) throw new Error("Not signed in");
      return { id: user.id, email: user.email, full_name: user.email };
    },
    async isAuthenticated() {
      return Boolean(await auth.getCurrentUser());
    },
    async logout(redirectTo = "/login") {
      try { await auth.signOut(); } catch { /* ignore */ }
      localStorage.removeItem("gsiUser");
      window.location.href = redirectTo === "/" ? "/login" : redirectTo;
    },
    redirectToLogin() {
      window.location.href = "/login";
    },
  },
  integrations: {
    Core: {
      // Item photos are not stored in the database yet; keep a local preview only.
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },
};
