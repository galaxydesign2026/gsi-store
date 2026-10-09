// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Submits a saved job sheet into the approval chain.
// submit_jobsheet allows resubmit from 'rejected'.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });
    const profile = profiles?.[0];
    if (!profile || (profile.role || '').toLowerCase() !== 'team_admin') {
      return Response.json({ error: 'Forbidden: Team Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { jobsheetid, userid, username } = body;
    if (!jobsheetid) return Response.json({ error: 'Missing jobsheetid' }, { status: 400 });
    if (!userid) return Response.json({ error: 'Missing userid' }, { status: 400 });

    const { data, error } = await supabase.rpc('submit_jobsheet', {
      p_jobsheetid: jobsheetid,
      p_actedby: userid,
      p_actedbyname: username || profile.username || user.email,
    });

    if (error) {
      // Surface the RPC's message (e.g. "job sheet is not in draft/rejected state").
      return Response.json({ error: error.message }, { status: 400 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    return Response.json({ success: true, result: result || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}