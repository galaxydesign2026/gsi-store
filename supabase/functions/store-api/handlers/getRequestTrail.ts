// @ts-nocheck
// Approval history (who / stage / action / remarks / when) for one item request.
// Read-only. Allowed: director and store_admin (monitoring roles).
import { supabase } from '../../_shared/supabaseClient.ts';
import { requestCaller, requestId, failRequest, requestFailure } from '../../_shared/requestWorkflow.ts';

export default async function (req) {
  try {
    await requestCaller(req, ['director', 'store_admin']);
    const { requestid } = await req.json();
    const id = requestId(requestid);
    const { data, error } = await supabase.from('approvals')
      .select('id, stagecode, action, actedbyname, remarks, acteddt')
      .eq('workflowtype', 'request').eq('refid', id)
      .order('acteddt', { ascending: true }).order('id', { ascending: true });
    if (error) failRequest(error.message, 500);
    return Response.json({ trail: data || [] });
  } catch (error) { return requestFailure(error); }
}
