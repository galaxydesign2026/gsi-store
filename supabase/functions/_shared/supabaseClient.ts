// Server-side Supabase client (service role). Runs ONLY inside Edge Functions — never in the browser.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_KEY")!,
  { auth: { persistSession: false } },
);
