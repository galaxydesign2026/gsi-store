// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from './base44compat.ts';
import { supabase } from './supabaseClient.ts';

export const approvalStages = {
  project_executive: { status: 'pending_pe', field: 'assignedpe' },
  team_manager: { status: 'pending_manager', field: 'assignedmanager' },
  director: { status: 'pending_director', field: 'assigneddirector' },
};
export function fail(message, status = 500) {
  throw Object.assign(new Error(message), { status });
}
export async function approvalCaller(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user?.email) fail('Unauthorized', 401);
  const { data, error } = await supabase.rpc('getuserdetails', { p_email: user.email.toLowerCase() });
  if (error) fail(error.message);
  const caller = Array.isArray(data) ? data[0] : data;
  const role = (caller?.role || '').trim().toLowerCase();
  if (!caller?.id || !approvalStages[role] || caller.isactive === false) fail('Forbidden: approver access required', 403);
  return { ...caller, role };
}
export function canReview(caller, sheet) {
  const stage = approvalStages[caller.role];
  return sheet.status === stage.status &&
    ((caller.role === 'director' && sheet.assigneddirector == null) ||
      (sheet[stage.field] != null && String(sheet[stage.field]) === String(caller.id)));
}
export async function approvalSheet(caller, id) {
  if (!id || !/^\d+$/.test(String(id))) fail('Invalid jobsheetid', 400);
  const { data, error } = await supabase.from('jobsheets').select('*').eq('id', id).maybeSingle();
  if (error) fail(error.message);
  if (!data || !canReview(caller, data)) fail('Forbidden: this job sheet is not awaiting your approval', 403);
  return data;
}
export async function resolveApprovers(sheets) {
  const fields = ['assignedpe', 'assignedmanager', 'assigneddirector'];
  const ids = [...new Set(sheets.flatMap(s => fields.map(f => s[f])).filter(id => id != null).map(String))];
  if (!ids.length) return sheets;
  const { data, error } = await supabase.from('userdetails').select('id, username').in('id', ids);
  if (error) fail(error.message);
  const names = Object.fromEntries((data || []).map(u => [String(u.id), u.username]));
  return sheets.map(s => ({ ...s, ...Object.fromEntries(fields.map(f => [f + '_name', names[String(s[f])] || '—'])) }));
}
export function approvalError(error) {
  return Response.json({ error: error.message }, { status: error.status || 500 });
}