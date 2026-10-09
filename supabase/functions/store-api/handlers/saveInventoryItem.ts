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

// ──────────────────────────────────────────────────────────────
// Generate next item code: find the highest numeric suffix of
// existing "GSI####" codes and increment by 1.
// e.g. GSI0003 → GSI0004, GSI0010 → GSI0011
// ──────────────────────────────────────────────────────────────
async function generateItemCode() {
  const { data, error } = await supabase
    .from('inventoryitems')
    .select('itemcode')
    .like('itemcode', 'GSI%')
    .order('itemcode', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'GSI0001';

  const lastCode = data[0].itemcode || '';
  const match = lastCode.match(/^GSI(\d+)$/i);
  if (!match) return 'GSI0001';

  const nextNum = parseInt(match[1], 10) + 1;
  return 'GSI' + String(nextNum).padStart(4, '0');
}

// ──────────────────────────────────────────────────────────────
// Reusable duplicate checker: returns true if another inventory
// record already has the same itemname + category + description
// (case-insensitive, trimmed). Excludes the record with excludeId
// when updating.
// ──────────────────────────────────────────────────────────────
async function checkDuplicate({ itemname, category, description, excludeId }) {
  let query = supabase
    .from('inventoryitems')
    .select('id, itemname, category, description')
    .ilike('itemname', itemname.trim())
    .ilike('category', category);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return false;

  const descLower = (description || '').trim().toLowerCase();
  return data.some((item) => {
    const itemDesc = (item.description || '').trim().toLowerCase();
    return itemDesc === descLower;
  });
}

export default async function handler(req: Request) {
  const fnStart = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // ── 1. Authenticate ──────────────────────────────────────
    const tAuth = Date.now();
    const user = await base44.auth.me();
    console.log('[saveInventoryItem] auth.me:', Date.now() - tAuth, 'ms');
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Authorize (admin or ceo only) ─────────────────────
    const tAuthz = Date.now();
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });
    const profile = profiles?.[0];
    console.log('[saveInventoryItem] authz:', Date.now() - tAuthz, 'ms');

    if (!profile || !['store_admin'].includes(profile.role?.toLowerCase())) {
      return Response.json(
        { success: false, error: 'Forbidden: Store Admin access required' },
        { status: 403 }
      );
    }

    // ── 3. Parse & validate body ────────────────────────────
    const body = await req.json();
    const {
      id,
      itemcode,
      itemname,
      category,
      brand,
      model,
      description,
      totalqty,
      availableqty,
      minimumqty,
      status,
    } = body;

    if (!itemname || !category || totalqty === undefined || availableqty === undefined) {
      return Response.json(
        { success: false, error: 'Missing required fields: itemname, category, totalqty, availableqty' },
        { status: 400 }
      );
    }

    // ── UPDATE path (Edit Item): id present → update by primary key ──
    if (id) {
      // ── Duplicate check (exclude current record) ───────────
      const isDupUpdate = await checkDuplicate({ itemname, category, description, excludeId: id });
      if (isDupUpdate) {
        return Response.json(
          { success: false, duplicate: true, error: 'Another inventory item with the same Item Name, Category and Description already exists.' },
          { status: 409 }
        );
      }

      const updateData = {
        itemname: itemname.trim(),
        category: category,
        brand: brand || null,
        model: model || null,
        totalqty: Number(totalqty),
        availableqty: Number(availableqty),
        minimumqty: minimumqty ? Number(minimumqty) : 0,
        status: status || 'Active',
        updatedby: profile.username || user.email || user.id,
        updateddt: new Date().toISOString(),
      };
      if (description !== undefined) {
        updateData.description = description.trim();
      }

      const tUpdate = Date.now();
      let { data: updated, error: updateError } = await supabase
        .from('inventoryitems')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      console.log('[saveInventoryItem] update:', Date.now() - tUpdate, 'ms');

      // If the 'description' column doesn't exist yet, retry without it
      if (updateError && /description.*column/i.test(updateError.message)) {
        console.log('[saveInventoryItem] description column not found, retrying update without it');
        const { description: _drop, ...updateNoDesc } = updateData;
        const tRetry = Date.now();
        const retry = await supabase
          .from('inventoryitems')
          .update(updateNoDesc)
          .eq('id', id)
          .select()
          .single();
        updated = retry.data;
        updateError = retry.error;
        console.log('[saveInventoryItem] retry update:', Date.now() - tRetry, 'ms');
      }

      if (updateError) {
        console.error('[saveInventoryItem] update error:', updateError);
        return Response.json(
          { success: false, error: `Database error: ${updateError.message}` },
          { status: 500 }
        );
      }

      if (!updated) {
        return Response.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        );
      }

      console.log(`[saveInventoryItem] Total backend duration: ${Date.now() - fnStart}ms`);
      return Response.json({
        success: true,
        message: 'Inventory item saved successfully.',
        item: updated,
      });
    }

    // ── INSERT path (Add Item): no id → insert new record ────

    // ── Duplicate check (all records) ──────────────────────
    const isDupInsert = await checkDuplicate({ itemname, category, description });
    if (isDupInsert) {
      return Response.json(
        { success: false, duplicate: true, error: 'An inventory item with the same Item Name, Category and Description already exists.' },
        { status: 409 }
      );
    }

    // ── 4. Auto-generate item code if not provided ──────────
    let finalCode = (itemcode || '').trim();
    if (!finalCode) {
      const tGen = Date.now();
      finalCode = await generateItemCode();
      console.log('[saveInventoryItem] generateItemCode:', Date.now() - tGen, 'ms');
    }

    // ── 5. Check for duplicate item code ────────────────────
    const tDup = Date.now();
    const { data: existing } = await supabase
      .from('inventoryitems')
      .select('id')
      .eq('itemcode', finalCode)
      .limit(1);
    console.log('[saveInventoryItem] dup-check:', Date.now() - tDup, 'ms');

    if (existing && existing.length > 0) {
      return Response.json(
        { success: false, error: `Duplicate item code: "${finalCode}" already exists` },
        { status: 409 }
      );
    }

    // ── 6. Insert into inventoryitems ───────────────────────
    const baseInsertData = {
      itemcode: finalCode,
      itemname: itemname.trim(),
      category: category,
      brand: brand || null,
      model: model || null,
      totalqty: Number(totalqty),
      availableqty: Number(availableqty),
      minimumqty: minimumqty ? Number(minimumqty) : 0,
      status: status || 'Active',
      createdby: profile.username || user.email || user.id,
      createddt: new Date().toISOString(),
      updatedby: profile.username || user.email || user.id,
      updateddt: new Date().toISOString(),
    };

    // Include description if provided — works once the column is added to Supabase
    const insertData = { ...baseInsertData };
    if (description) {
      insertData.description = description.trim();
    }

    const tInsert = Date.now();
    let { data: inserted, error: insertError } = await supabase
      .from('inventoryitems')
      .insert(insertData)
      .select()
      .single();
    console.log('[saveInventoryItem] insert:', Date.now() - tInsert, 'ms');

    // If the 'description' column doesn't exist yet, retry without it
    if (insertError && /description.*column/i.test(insertError.message)) {
      console.log('[saveInventoryItem] description column not found, retrying without it');
      const tRetry = Date.now();
      const retry = await supabase
        .from('inventoryitems')
        .insert(baseInsertData)
        .select()
        .single();
      inserted = retry.data;
      insertError = retry.error;
      console.log('[saveInventoryItem] retry insert:', Date.now() - tRetry, 'ms');
    }

    if (insertError) {
      console.error('[saveInventoryItem] insert error:', insertError);
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        return Response.json(
          { success: false, error: `Duplicate item code: "${finalCode}" already exists` },
          { status: 409 }
        );
      }
      return Response.json(
        { success: false, error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`[saveInventoryItem] Total backend duration: ${Date.now() - fnStart}ms`);

    return Response.json({
      success: true,
      message: 'Inventory item saved successfully.',
      item: inserted,
    });

  } catch (err) {
    console.error('[saveInventoryItem] error:', err);
    console.log(`[saveInventoryItem] Total backend duration (error): ${Date.now() - fnStart}ms`);
    return Response.json(
      { success: false, error: err.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
