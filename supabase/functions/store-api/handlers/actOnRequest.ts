// @ts-nocheck — ported from Base44 (plain JS semantics)
import { requestCaller, requestId, workflowRequest, canReviewRequest, requestRpc, failRequest, requestFailure } from '../../_shared/requestWorkflow.ts';

export default async function(req) {
  try {
    const caller = await requestCaller(req, ['store_admin', 'project_executive', 'team_manager']);
    const input = await req.json();
    const id = requestId(input.requestid);
    if (!['approve', 'reject'].includes(input.action)) failRequest('Action must be approve or reject.');
    const remarks = typeof input.remarks === 'string' ? input.remarks.trim() : '';
    if (input.action === 'reject' && !remarks) failRequest('Remarks are required to reject.');
    const request = await workflowRequest(id);
    if (!canReviewRequest(caller, request)) failRequest('You cannot review this request at its current approval stage.', 403);
    return await requestRpc('advance_approval', {
      p_workflowtype: 'request', p_refid: id, p_fromstatus: request.status,
      p_action: input.action, p_actedby: caller.id, p_actedbyname: caller.username, p_remarks: remarks || null,
    });
  } catch (error) { return requestFailure(error); }
}