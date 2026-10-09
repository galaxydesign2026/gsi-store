// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Updates an existing user profile via the update_user RPC.
// p_actedby + p_userid are userdetails.id values (frontend gsiUser + row id).
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
    const { actedby, userid, username, role, team, designation, isactive } = body;

    if (!userid || !username || !role) {
      return Response.json({ error: 'Missing required fields: userid, username, role' }, { status: 400 });
    }

    const { error } = await supabase.rpc('update_user', {
      p_actedby: actedby,
      p_userid: userid,
      p_username: String(username).trim(),
      p_role: role,
      p_team: team || null,
      p_designation: designation || null,
      p_isactive: isactive === undefined ? true : isactive,
    });

    if (error) {
      console.error('update_user error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('updateUserRecord error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}