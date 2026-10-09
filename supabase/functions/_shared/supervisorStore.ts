// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from './base44compat.ts';
import { supabase } from './supabaseClient.ts';

export function storeFail(message, status = 500) {
  throw Object.assign(new Error(message), { status });
}
export async function supervisorCaller(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user?.email) storeFail('Unauthorized', 401);
  const { data, error } = await supabase.rpc('getuserdetails', { p_email: user.email.toLowerCase() });
  if (error) storeFail(error.message);
  const caller = Array.isArray(data) ? data[0] : data;
  if (!caller?.id || (caller.role || '').trim().toLowerCase() !== 'supervisor' || caller.isactive === false) {
    storeFail('Forbidden: supervisor access required', 403);
  }
  return caller;
}
// The no-input catalogue/history endpoints return their complete scoped lists.
// Page through PostgREST rather than silently stopping at its row limit.
export async function storeRows(query) {
  const rows = [];
  for (let offset = 0;;) {
    const { data, count, error } = await query().range(offset, offset + 499);
    if (error) storeFail(error.message);
    rows.push(...(data || []));
    offset += data?.length || 0;
    if (!data?.length || offset >= count) break;
  }
  return rows;
}
export function approvedSupervisorSheets(caller, select = 'id, jobsheetno, projectname, teamcode, jobsheetlines!inner(supervisorid)') {
  return supabase.from('jobsheets').select(select, { count: 'exact' })
    .eq('status', 'approved').eq('jobsheetlines.supervisorid', caller.id);
}
export function storeError(error) {
  return Response.json({ error: error.message }, { status: error.status || 500 });
}