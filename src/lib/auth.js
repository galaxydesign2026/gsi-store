// =====================================================================
// Auth adapter — the ONLY frontend file that knows the auth provider.
//
// NOW:   Supabase Auth
// LATER: replace this file's internals with FastAPI/JWT calls.
//        Keep the exported function names and return shapes the same,
//        and no other frontend file needs to change.
//
// Rules:
// - Never return provider objects (Supabase session/user) to callers.
// - Never store tokens in localStorage manually (the provider manages it).
// - Never put role/team/business data in the auth provider.
// =====================================================================
import { supabase } from "@/lib/supabase";

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provider-neutral user shape used by the whole app.
const toAppUser = (u) =>
  u ? { id: String(u.id), email: (u.email || "").toLowerCase(), emailVerified: Boolean(u.email_confirmed_at) } : null;

// Provider-neutral error: always an Error with a readable message.
const fail = (error, fallback) => {
  const e = new Error(error?.message || fallback);
  e.code = error?.code || error?.status;
  throw e;
};

const appUrl = (path) => `${window.location.origin}${path}`;

// ---------- Session ----------

// Returns the signed-in user or null. Never throws.
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return toAppUser(data?.session?.user);
}

// Headers the API layer must send. Keeps provider-specific headers here.
export async function getRequestHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { "Content-Type": "application/json", apikey: ANON_KEY };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Subscribe to sign-in / sign-out changes. Returns an unsubscribe function.
// callback(event, user) — event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED" | "PASSWORD_RECOVERY" | ...
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, toAppUser(session?.user));
  });
  return () => data?.subscription?.unsubscribe();
}

// ---------- Login / Logout ----------

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) fail(error, "Invalid email or password");
  return toAppUser(data.user);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) fail(error, "Sign out failed");
}

// ---------- Register (6-digit email code) ----------

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: appUrl("/login") },
  });
  if (error) {
    if (error.code === "user_already_exists" || /already registered|already exists/i.test(error.message || "")) {
      throw new Error("This email is already registered. Please log in instead.");
    }
    fail(error, "Registration failed");
  }
  // Existing account: Supabase returns a user with no identities and sends no code.
  const identities = data?.user?.identities;
  if (data?.user && (!Array.isArray(identities) || identities.length === 0)) {
    throw new Error("This email is already registered. Please log in instead.");
  }
  return toAppUser(data.user);
}

export async function verifySignupCode(email, code) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: String(code).trim(),
    type: "signup",
  });
  if (error) fail(error, "Invalid verification code");
  return toAppUser(data.user);
}

export async function resendSignupCode(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
  });
  if (error) fail(error, "Could not resend code");
}

// ---------- Forgot / Reset password ----------

// Sends a password reset email (Supabase Auth). Always resolves the same way
// so the page never reveals whether an email exists.
export async function requestPasswordReset(email) {
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: appUrl("/reset-password"),
  });
}

// Called on /reset-password after the user opens the email link
// (the provider creates a temporary recovery session from that link).
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) fail(error, "Could not update password");
}

// Used by /reset-password after the user opens the email link.
// Returns { ready: true } when a valid recovery session exists,
// or { ready: false, error } when the link is invalid/expired/missing.
// (The provider reads the link token from the URL on page load.)
export async function getRecoveryState() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const linkError = hash.get("error_description") || query.get("error_description");
  if (linkError) return { ready: false, error: linkError.replace(/\+/g, " ") };

  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) return { ready: true };
  return { ready: false, error: "This password reset link is missing or invalid" };
}

// ---------- Dev-only test hook (removed from production builds) ----------
if (import.meta.env.DEV) {
  window.gsiStoreAuth = { signIn, signOut, getCurrentUser, getRequestHeaders };
}
