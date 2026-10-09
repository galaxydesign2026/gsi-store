// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Lists all job sheets for the calling Team Admin's team, newest first.
// Resolves assignedpe / assignedmanager (userdetails.id) to display usernames
// so the list never shows raw IDs. Read-only — no workflow changes.
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

    const sheetsRes = await supabase
      .from('jobsheets')
      .select('*')
      .eq('teamcode', team)
      .order('id', { ascending: false });

    if (sheetsRes.error) return Response.json({ error: sheetsRes.error.message }, { status: 500 });
    const sheets = sheetsRes.data || [];

    // Resolve PE + Manager ids → usernames in one pass.
    const idSet = new Set();
    for (const s of sheets) {
      if (s.assignedpe != null) idSet.add(String(s.assignedpe));
      if (s.assignedmanager != null) idSet.add(String(s.assignedmanager));
    }
    let nameMap = {};
    if (idSet.size > 0) {
      const usersRes = await supabase
        .from('userdetails')
        .select('id, username')
        .in('id', Array.from(idSet));
      if (usersRes.error) return Response.json({ error: usersRes.error.message }, { status: 500 });
      for (const u of usersRes.data || []) {
        nameMap[String(u.id)] = u.username;
      }
    }

    const jobsheets = sheets.map((s) => ({
      ...s,
      assignedpe_name: s.assignedpe != null ? (nameMap[String(s.assignedpe)] || '—') : '—',
      assignedmanager_name: s.assignedmanager != null ? (nameMap[String(s.assignedmanager)] || '—') : '—',
    }));

    return Response.json({ team, jobsheets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}