// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Deletes a draft/rejected job sheet via the delete_jobsheet RPC.
// p_actedby is the acting Team Admin's userdetails.id (bigint).
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
    const { jobsheetid, userid } = body;
    if (!jobsheetid) return Response.json({ error: 'Missing jobsheetid' }, { status: 400 });
    if (!userid) return Response.json({ error: 'Missing userid' }, { status: 400 });

    const { data, error } = await supabase.rpc('delete_jobsheet', {
      p_jobsheetid: jobsheetid,
      p_actedby: userid,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    return Response.json({ success: true, result: result || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}