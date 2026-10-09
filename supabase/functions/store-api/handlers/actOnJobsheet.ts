// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { approvalCaller, approvalSheet, fail, approvalError } from '../../_shared/jobsheetApprovalAccess.ts';

export default async function(req) {
  try {
    const caller = await approvalCaller(req);
    const { jobsheetid, action, remarks: suppliedRemarks } = await req.json();
    if (!['approve', 'reject'].includes(action)) fail('Invalid action', 400);
    if (suppliedRemarks != null && typeof suppliedRemarks !== 'string') fail('Invalid remarks', 400);
    const remarks = (suppliedRemarks || '').trim();
    if (action === 'reject' && !remarks) fail('Remarks are required to reject.', 400);
    const sheet = await approvalSheet(caller, jobsheetid);
    const { data: result, error } = await supabase.rpc('advance_approval', {
      p_workflowtype: 'jobsheet', p_refid: sheet.id, p_fromstatus: sheet.status,
      p_action: action, p_actedby: caller.id, p_actedbyname: caller.username,
      p_remarks: remarks || null,
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    // Read the actual resulting status rather than guessing the RPC's transition.
    const { data: updated, error: readError } = await supabase.from('jobsheets').select('status').eq('id', sheet.id).maybeSingle();
    if (readError) console.warn('Post-action status unavailable:', readError.message);
    return Response.json({ success: true, result, nextStatus: updated?.status || null });
  } catch (error) { return approvalError(error); }
}