// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Returns the user lists needed to build a Job Sheet form for the calling
// Team Admin. Directors (any), PE + Manager (admin's team), Supervisors (any team).
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
    const team = profile.team;
    if (!team) return Response.json({ error: 'Your profile has no team assigned' }, { status: 400 });

    const [directorsRes, peRes, managersRes, supervisorsRes] = await Promise.all([
      supabase.from('userdetails').select('id, username').eq('role', 'director').eq('isactive', true).order('username'),
      supabase.from('userdetails').select('id, username').eq('role', 'project_executive').eq('team', team).eq('isactive', true).order('username'),
      supabase.from('userdetails').select('id, username').eq('role', 'team_manager').eq('team', team).eq('isactive', true).order('username'),
      supabase.from('userdetails').select('id, username, team').eq('role', 'supervisor').eq('isactive', true).order('username'),
    ]);

    for (const r of [directorsRes, peRes, managersRes, supervisorsRes]) {
      if (r.error) return Response.json({ error: r.error.message }, { status: 500 });
    }

    return Response.json({
      team,
      directors: directorsRes.data || [],
      projectExecutives: peRes.data || [],
      teamManagers: managersRes.data || [],
      supervisors: supervisorsRes.data || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}