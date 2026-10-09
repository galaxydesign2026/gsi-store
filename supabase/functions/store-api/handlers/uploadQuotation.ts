// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { supabase } from '../../_shared/supabaseClient.ts';

// Uploads the quotation PDF to Supabase Storage at <jobsheetno>/quotation.pdf
// (upsert = overwrite) and writes the path back onto the job sheet record.
// File arrives as base64 in JSON (base44.functions.invoke sends JSON bodies).
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
    const { jobsheetid, jobsheetno, filebase64, filename, contenttype } = body;
    if (!jobsheetid || !jobsheetno || !filebase64) {
      return Response.json({ error: 'Missing jobsheetid, jobsheetno or file' }, { status: 400 });
    }

    const bin = atob(filebase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const path = `${jobsheetno}/quotation.pdf`;

    const { error: upErr } = await supabase.storage
      .from('jobsheets')
      .upload(path, bytes, { contentType: contenttype || 'application/pdf', upsert: true });

    if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

    // Persist the path back onto the jobsheets row and CONFIRM it landed.
    // Only quotationfilepath is touched — the table has no updatedby/updateddt
    // columns, and including them made this UPDATE error out (leaving the row NULL
    // even though Storage had the file). .select() returns the updated row so we
    // can verify; 0 rows means the id didn't match.
    const originalName = filename || path.split('/').pop();

    const { data: updated, error: updErr } = await supabase
      .from('jobsheets')
      .update({ quotationfilepath: path, quotationfilename: originalName })
      .eq('id', jobsheetid)
      .select('id, quotationfilepath, quotationfilename');

    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
    if (!updated || updated.length === 0) {
      return Response.json({ error: 'Job sheet not found — path not saved' }, { status: 404 });
    }

    return Response.json({
      success: true,
      quotationfilepath: updated[0].quotationfilepath,
      quotationfilename: updated[0].quotationfilename,
      filename: originalName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}