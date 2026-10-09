// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Returns the teams master list for the Team dropdown (used by directors).
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

    const { data, error } = await supabase.from('teams').select('teamcode, teamname').order('teamcode');
    if (error) {
      console.error('getTeams error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ teams: data || [] });
  } catch (err) {
    console.error('getTeams error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}