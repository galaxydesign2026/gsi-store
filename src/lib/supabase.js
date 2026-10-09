// Frontend Supabase client. Uses ONLY the public anon key.
// Set these in Cloudflare Pages env vars (and .env.local for dev).
// NEVER put the service_role key here.
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
