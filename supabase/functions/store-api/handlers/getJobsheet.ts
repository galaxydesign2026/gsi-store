// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Loads a single job sheet (header + lines) for EDIT mode.
// Only the Team Admin of that sheet's team may open it.
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

    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const { jobsheetid } = body;
    if (!jobsheetid) return Response.json({ error: 'Missing jobsheetid' }, { status: 400 });

    const [headerRes, linesRes] = await Promise.all([
      supabase.from('jobsheets').select('*').eq('id', jobsheetid).single(),
      supabase.from('jobsheetlines').select('*').eq('jobsheetid', jobsheetid).order('id'),
    ]);

    if (headerRes.error) return Response.json({ error: headerRes.error.message }, { status: 500 });
    if (linesRes.error) return Response.json({ error: linesRes.error.message }, { status: 500 });

    const sheet = headerRes.data;
    if (!sheet || sheet.teamcode !== profile.team) {
      return Response.json({ error: 'Forbidden: you can only open job sheets for your own team' }, { status: 403 });
    }

    return Response.json({ jobsheet: sheet, lines: linesRes.data || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}