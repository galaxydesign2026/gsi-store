// @ts-nocheck — ported from Base44 (plain JS semantics)
import { requestCaller, requestId, workflowRequest, requireIssuable, requestRpc, failRequest, requestFailure } from '../../_shared/requestWorkflow.ts';

export default async function(req) {
  try {
    const caller = await requestCaller(req, ['store_admin']);
    const input = await req.json();
    const id = requestId(input.requestid);
    const remarks = typeof input.remarks === 'string' ? input.remarks.trim() : '';
    if (!remarks) failRequest('Remarks are required to cancel.');
    requireIssuable(await workflowRequest(id));
    return await requestRpc('cancel_items', { p_requestid: id, p_actedby: caller.id, p_actedbyname: caller.username, p_remarks: remarks || null });
  } catch (error) { return requestFailure(error); }
}