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

// Columns selected from the inventoryitems table
const INVENTORY_COLUMNS =
  'id, itemcode, itemname, category, brand, model, description, totalqty, availableqty, minimumqty, status, createdby, createddt, updatedby, updateddt';

export default async function handler(req: Request) {
  const fnStart = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    const t1 = Date.now();
    const user = await base44.auth.me();
    console.log('auth.me:', Date.now() - t1, 'ms');
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ──────────────────────────────────────────────────────────
    // Parse optional query params for future pagination/filtering.
    // Defaults: no pagination (returns all rows ordered by itemname).
    // ──────────────────────────────────────────────────────────
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '0', 10);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';

    // ──────────────────────────────────────────────────────────
    // Run the authorization lookup and the data fetch CONCURRENTLY.
    // ──────────────────────────────────────────────────────────
    const t2 = Date.now();
    let query = supabase
      .from('inventoryitems')
      .select(INVENTORY_COLUMNS)
      .order('itemname');

    // Future filtering support
    if (search) {
      query = query.or(`itemcode.ilike.%${search}%,itemname.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Future pagination support
    if (pageSize > 0) {
      const offset = page * pageSize;
      query = query.range(offset, offset + pageSize - 1);
    }

    const [profiles, itemsResult] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id }),
      query,
    ]);
    console.log('authz+inventory-select:', Date.now() - t2, 'ms');

    const profile = profiles?.[0];
    if (!profile || !['store_admin', 'director', 'team_manager'].includes(profile.role?.toLowerCase())) {
      return Response.json(
        { error: 'Forbidden: insufficient access' },
        { status: 403 }
      );
    }

    const { data, error } = itemsResult;
    if (error) {
      console.error('getAllInventory error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log(`[getAllInventory] Total backend duration: ${Date.now() - fnStart}ms`);
    return Response.json({ items: data || [] });

  } catch (err) {
    console.error('getAllInventory error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
