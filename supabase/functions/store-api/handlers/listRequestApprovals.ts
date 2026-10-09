// @ts-nocheck — ported from Base44 (plain JS semantics)
import { requestCaller, requestQueue, requestSelect, requestFailure } from '../../_shared/requestWorkflow.ts';

export default async function(req) {
  try {
    const caller = await requestCaller(req, ['project_executive', 'team_manager']);
    const input = await req.json();
    const pe = caller.role === 'project_executive';
    const query = requestSelect().eq('status', pe ? 'pending_pe' : 'pending_manager')
      .eq(pe ? 'assignedpe' : 'assignedmanager', caller.id);
    return await requestQueue(query, input);
  } catch (error) { return requestFailure(error); }
}