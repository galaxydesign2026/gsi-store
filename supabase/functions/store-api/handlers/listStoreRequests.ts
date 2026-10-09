// @ts-nocheck — ported from Base44 (plain JS semantics)
import { requestCaller, requestQueue, requestSelect, requestFailure, failRequest } from '../../_shared/requestWorkflow.ts';

export default async function(req) {
  try {
    await requestCaller(req, ['store_admin']);
    const input = await req.json();
    let query = requestSelect();
    if (input.statuses !== undefined) {
      const allowed = ['pending_store', 'pending_pe', 'pending_manager', 'approved', 'partially_issued', 'issued', 'rejected', 'cancelled'];
      if (!Array.isArray(input.statuses) || !input.statuses.length || input.statuses.some(s => !allowed.includes(s))) failRequest('Invalid status filter.');
      query = query.in('status', input.statuses);
    }
    return await requestQueue(query, input);
  } catch (error) { return requestFailure(error); }
}