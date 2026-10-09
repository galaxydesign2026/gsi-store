// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Activates/deactivates a user via the set_user_active RPC.
// p_actedby + p_userid are userdetails.id values.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });
    const profile = profiles?.[0];
    if (!profile || !['team_admin', 'director', 'team_manager'].includes((profile.role || '').toLowerCase())) {
      return Response.json({ error: 'Forbidden: insufficient access' }, { status: 403 });
    }

    const body = await req.json();
    const { actedby, userid, isactive } = body;

    if (!userid || isactive === undefined || isactive === null) {
      return Response.json({ error: 'Missing required fields: userid, isactive' }, { status: 400 });
    }

    const { error } = await supabase.rpc('set_user_active', {
      p_actedby: actedby,
      p_userid: userid,
      p_isactive: isactive,
    });

    if (error) {
      console.error('set_user_active error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('setUserActive error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}