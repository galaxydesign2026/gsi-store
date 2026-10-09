// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Returns the userdetails list scoped to the caller:
//   director       -> ALL users
//   team_manager   -> users in caller's team
//   team_admin     -> users in caller's team
// Reads are direct Supabase queries (no business RPC).
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

    const role = (profile.role || '').toLowerCase();

    let query = supabase
      .from('userdetails')
      .select('id, employeeid, email, username, role, team, isactive, designation')
      .order('username');

    if (role !== 'director') {
      if (!profile.team) return Response.json({ users: [] });
      query = query.eq('team', profile.team);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getAllUsers error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ users: data || [] });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}