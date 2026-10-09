// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { requestCaller, requestId, workflowRequest, requireIssuable, requestRpc, failRequest, requestFailure } from '../../_shared/requestWorkflow.ts';

export default async function(req) {
  try {
    const caller = await requestCaller(req, ['store_admin']);
    const input = await req.json();
    const id = requestId(input.requestid);
    requireIssuable(await workflowRequest(id));
    if (input.items != null && !Array.isArray(input.items)) failRequest('Items must be a list.');
    const items = input.items?.length ? input.items.map(i => ({ requestitemid: Number(i?.requestitemid), qty: Number(i?.qty) })) : null;
    if (items) {
      if (items.some(i => !Number.isSafeInteger(i.requestitemid) || i.requestitemid <= 0 || !Number.isSafeInteger(i.qty) || i.qty <= 0)) failRequest('Issue quantities must be positive whole numbers.');
      if (new Set(items.map(i => i.requestitemid)).size !== items.length) failRequest('Duplicate request items are not allowed.');
      const { data: lines, error } = await supabase.from('requestitems').select('id,qtyrequested,qtyissued')
        .eq('requestid', id).in('id', items.map(i => i.requestitemid));
      if (error) failRequest(error.message, 500);
      const byId = new Map((lines || []).map(l => [String(l.id), l]));
      if (items.some(i => !byId.has(String(i.requestitemid)))) failRequest('One or more items do not belong to this request.');
      if (items.some(i => { const l = byId.get(String(i.requestitemid)); return i.qty > Number(l.qtyrequested) - Number(l.qtyissued); })) failRequest('Issue quantity exceeds the remaining quantity.');
    }
    return await requestRpc('issue_items', { p_requestid: id, p_actedby: caller.id, p_actedbyname: caller.username, p_items: items });
  } catch (error) { return requestFailure(error); }
}