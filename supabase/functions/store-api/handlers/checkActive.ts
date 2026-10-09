// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

export default async function handler(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ valid: false });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY'))
    );

    const { data, error } = await supabase.rpc("isvaliduser", { p_email: user.email });

    if (error) {
      console.error("[checkActive] RPC error:", error.message);
      return Response.json({ valid: true, transientError: true });
    }

    const valid = data === true || (Array.isArray(data) && data[0]?.isvaliduser === true);
    return Response.json({ valid });

  } catch (err) {
    console.error("[checkActive] Unexpected error:", err.message);
    return Response.json({ valid: true, transientError: true });
  }
}
