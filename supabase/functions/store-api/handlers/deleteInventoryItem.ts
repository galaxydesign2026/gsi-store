// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────
// Hoisted to MODULE scope: created once per warm isolate, so the
// DB connection is reused across requests instead of paying a fresh
// DNS + TLS + PostgREST handshake on every call.
// ──────────────────────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY')),
  { auth: { persistSession: false } }
);

export default async function handler(req: Request) {
  const fnStart = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // ── 1. Authenticate ──────────────────────────────────────
    const tAuth = Date.now();
    const user = await base44.auth.me();
    console.log('[deleteInventoryItem] auth.me:', Date.now() - tAuth, 'ms');
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Authorize (admin or ceo only) ─────────────────────
    const tAuthz = Date.now();
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });
    const profile = profiles?.[0];
    console.log('[deleteInventoryItem] authz:', Date.now() - tAuthz, 'ms');

    if (!profile || !['store_admin'].includes(profile.role?.toLowerCase())) {
      return Response.json(
        { success: false, error: 'Forbidden: Store Admin access required' },
        { status: 403 }
      );
    }

    // ── 3. Parse body ───────────────────────────────────────
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // ── 4. Delete from inventoryitems by primary key ─────────
    const tDelete = Date.now();
    const { data: deleted, error: deleteError } = await supabase
      .from('inventoryitems')
      .delete()
      .eq('id', id)
      .select();
    console.log('[deleteInventoryItem] delete:', Date.now() - tDelete, 'ms');

    if (deleteError) {
      console.error('[deleteInventoryItem] delete error:', deleteError);
      return Response.json(
        { success: false, error: `Database error: ${deleteError.message}` },
        { status: 500 }
      );
    }

    if (!deleted || deleted.length === 0) {
      return Response.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    console.log(`[deleteInventoryItem] Total backend duration: ${Date.now() - fnStart}ms`);
    return Response.json({
      success: true,
      message: 'Item deleted successfully.',
    });

  } catch (err) {
    console.error('[deleteInventoryItem] error:', err);
    console.log(`[deleteInventoryItem] Total backend duration (error): ${Date.now() - fnStart}ms`);
    return Response.json(
      { success: false, error: err.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
