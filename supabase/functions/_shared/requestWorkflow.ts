// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from './base44compat.ts';
import { supabase } from './supabaseClient.ts';

export function failRequest(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function requestFailure(error) { return Response.json({ error: error.message }, { status: error.status || 500 }); }
export async function requestCaller(req, roles) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user?.email) failRequest('Unauthorized', 401);
  const { data, error } = await supabase.rpc('getuserdetails', { p_email: user.email.toLowerCase() });
  if (error) failRequest(error.message, 500);
  const caller = Array.isArray(data) ? data[0] : data;
  if (!caller?.id || !roles.includes(caller.role) || caller.isactive === false) failRequest('Forbidden', 403);
  return caller;
}
export function requestId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) failRequest('A valid request ID is required.');
  return id;
}
export async function workflowRequest(id) {
  const { data, error } = await supabase.from('requests').select('id,status,assignedpe,assignedmanager').eq('id', id).maybeSingle();
  if (error) failRequest(error.message, 500);
  if (!data) failRequest('Request not found.', 404);
  return data;
}
export function canReviewRequest(caller, request) {
  return (caller.role === 'store_admin' && request.status === 'pending_store') ||
    (caller.role === 'project_executive' && request.status === 'pending_pe' && String(request.assignedpe) === String(caller.id)) ||
    (caller.role === 'team_manager' && request.status === 'pending_manager' && String(request.assignedmanager) === String(caller.id));
}
export function requireIssuable(request) {
  if (!['approved', 'partially_issued'].includes(request.status)) failRequest('Request is not ready to issue.');
}
export async function requestRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true, result: data });
}
export async function requestQueue(query, input = {}) {
  const page = Math.max(1, Math.floor(Number(input.page) || 1));
  const pageSize = [10, 20, 50].includes(Number(input.pageSize)) ? Number(input.pageSize) : 50;
  const { data, error, count } = await query.order('createddt', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) failRequest(error.message, 500);
  return Response.json({ requests: (data || []).map(r => ({ ...r, supervisorname: r.supervisor?.username || '—' })), total: count || 0, page, pageSize });
}
export function requestSelect() {
  return supabase.from('requests').select('id,requestno,jobsheetno,teamcode,status,createddt,remarks,supervisor:userdetails!supervisorid(username),requestitems(id,itemcode,itemname,qtyrequested,qtyissued,linestatus)', { count: 'exact' });
}