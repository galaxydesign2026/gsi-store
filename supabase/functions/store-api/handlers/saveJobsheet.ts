// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Saves a Job Sheet. NEW -> create_jobsheet RPC; existing draft/rejected ->
// update_jobsheet RPC. All business logic lives in the Postgres RPCs.
// All user ids are userdetails.id (bigint) — passed from the frontend's gsiUser
// and dropdown values. Never Base44 auth ids.
// After the RPC writes the lines, persist each line's supervisor display name
// by resolving supervisorid -> userdetails.username. Keeps jobsheetlines
// self-contained (PDF/list rendering) without changing the RPC contract.
async function ensureSupervisorNames(sheetId) {
  if (!sheetId) return;
  const linesRes = await supabase
    .from('jobsheetlines')
    .select('id, supervisorid')
    .eq('jobsheetid', sheetId)
    .not('supervisorid', 'is', null);
  if (linesRes.error || !linesRes.data?.length) return;
  const ids = [...new Set(linesRes.data.map((l) => l.supervisorid))];
  const usersRes = await supabase
    .from('userdetails')
    .select('id, username')
    .in('id', ids);
  if (usersRes.error) return;
  const nameById = {};
  for (const u of usersRes.data || []) nameById[String(u.id)] = u.username;
  for (const l of linesRes.data) {
    const name = nameById[String(l.supervisorid)];
    if (name) {
      await supabase
        .from('jobsheetlines')
        .update({ supervisorname: name })
        .eq('id', l.id);
    }
  }
}

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
    const {
      jobsheetid,
      projectname,
      projectprefix,
      assignedpe,
      assignedmanager,
      assigneddirector,
      lines,
      userid,   // gsiUser.userId (userdetails.id) — acting user for update
      username, // gsiUser.username — creator name for create
    } = body;

    if (!projectname || !projectprefix || !assignedpe || !assignedmanager || !assigneddirector) {
      return Response.json({ error: 'Missing required header fields' }, { status: 400 });
    }
    if (!Array.isArray(lines)) {
      return Response.json({ error: 'lines must be an array' }, { status: 400 });
    }

    const cleanPrefix = String(projectprefix).toUpperCase();

    let rpcResult;
    if (jobsheetid) {
      // Update of an existing draft/rejected sheet.
      rpcResult = await supabase.rpc('update_jobsheet', {
        p_jobsheetid: jobsheetid,
        p_projectname: String(projectname).trim(),
        p_prefix: cleanPrefix,
        p_assignedpe: assignedpe,
        p_assignedmanager: assignedmanager,
        p_assigneddirector: assigneddirector,
        p_lines: lines,
        p_actedby: userid,
      });
    } else {
      rpcResult = await supabase.rpc('create_jobsheet', {
        p_teamcode: profile.team,
        p_projectname: String(projectname).trim(),
        p_prefix: cleanPrefix,
        p_createdby: username || profile.username,
        p_assignedpe: assignedpe,
        p_assignedmanager: assignedmanager,
        p_assigneddirector: assigneddirector,
        p_lines: lines,
      });
    }

    if (rpcResult.error) {
      // Surface the RPC's own message (e.g. "Assigned PE does not belong to team").
      return Response.json({ error: rpcResult.error.message }, { status: 400 });
    }

    const result = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
    // Persist supervisorname on the saved lines (create or update).
    const sheetId = jobsheetid || result?.id;
    if (sheetId) {
      try { await ensureSupervisorNames(sheetId); } catch { /* non-fatal */ }
    }
    return Response.json({ success: true, result: result || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}