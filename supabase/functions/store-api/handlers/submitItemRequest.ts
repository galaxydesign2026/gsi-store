// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { supervisorCaller, approvedSupervisorSheets, storeFail, storeError } from '../../_shared/supervisorStore.ts';

export default async function(req) {
  try {
    const caller = await supervisorCaller(req);
    const { jobsheetid, items } = await req.json();
    const sheetId = Number(jobsheetid);
    if (!Number.isSafeInteger(sheetId) || sheetId <= 0) storeFail('Select a valid job sheet.', 400);
    if (!Array.isArray(items) || !items.length) storeFail('Add at least one item.', 400);
    const lines = items.map(i => ({ itemid: Number(i?.itemid), qty: Number(i?.qty) }));
    if (lines.some(i => !Number.isSafeInteger(i.itemid) || i.itemid <= 0 || !Number.isSafeInteger(i.qty) || i.qty < 1)) {
      storeFail('Each item requires a valid item ID and a whole-number quantity of at least 1.', 400);
    }
    if (new Set(lines.map(i => i.itemid)).size !== lines.length) storeFail('An item may only appear once in a request.', 400);
    const { data: sheet, error: sheetError } = await approvedSupervisorSheets(caller).eq('id', sheetId).maybeSingle();
    if (sheetError) storeFail(sheetError.message);
    if (!sheet) storeFail('You are not a supervisor on this approved job sheet.', 403);
    // Availability and stock reservation are handled atomically by the existing RPC.
    const { data, error } = await supabase.rpc('submit_request', {
      p_supervisorid: caller.id, p_jobsheetid: sheetId, p_createdby: caller.username, p_items: lines,
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    const result = Array.isArray(data) ? data[0] : data;
    return Response.json({ success: true, result });
  } catch (error) { return storeError(error); }
}