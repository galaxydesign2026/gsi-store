// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { requestCaller, requestFailure } from '../../_shared/requestWorkflow.ts';

const dashboards = {
  supervisor: 'get_supervisor_dashboard',
  project_executive: 'get_pe_dashboard',
  team_manager: 'get_manager_dashboard',
  team_admin: 'get_teamadmin_dashboard',
  director: 'get_director_dashboard',
  store_admin: 'get_storeadmin_dashboard',
  operations_manager: 'get_opsmanager_dashboard',
};

export default async function(req) {
  try {
    const caller = await requestCaller(req, Object.keys(dashboards));
    const args = ['store_admin', 'operations_manager'].includes(caller.role) ? {} : { p_userid: caller.id };
    const { data, error } = await supabase.rpc(dashboards[caller.role], args);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ role: caller.role, data });
  } catch (error) { return requestFailure(error); }
}