// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Creates a user profile via the create_user RPC.
// All hierarchy/role rules live in Postgres; we only forward + surface errors.
// p_actedby is userdetails.id (gsiUser.userId), passed from the frontend.
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
    const { actedby, email, username, role, team, designation } = body;

    if (!email || !username || !role) {
      return Response.json({ error: 'Missing required fields: email, username, role' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('create_user', {
      p_actedby: actedby,
      p_email: String(email).toLowerCase(),
      p_username: String(username).trim(),
      p_role: role,
      p_team: team || null,
      p_designation: designation || null,
    });

    if (error) {
      console.error('create_user error:', error);
      // Surface the RPC's own message (hierarchy rules etc.)
      return Response.json({ error: error.message }, { status: 400 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    const employeeid = result?.employeeid ?? result?.employee_id ?? result?.employeeId ?? null;

    return Response.json({ success: true, employeeid });
  } catch (err) {
    console.error('createUserRecord error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}