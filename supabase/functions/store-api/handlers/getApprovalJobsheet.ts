// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { approvalCaller, approvalSheet, resolveApprovers, fail, approvalError } from '../../_shared/jobsheetApprovalAccess.ts';

export default async function(req) {
  try {
    const caller = await approvalCaller(req);
    const { jobsheetid } = await req.json();
    const sheet = await approvalSheet(caller, jobsheetid);
    const [named, linesRes] = await Promise.all([
      resolveApprovers([sheet]),
      supabase.from('jobsheetlines').select('*').eq('jobsheetid', sheet.id).order('id', { ascending: true }),
    ]);
    if (linesRes.error) fail(linesRes.error.message);
    const jobsheet = named[0];
    if (sheet.quotationfilepath) {
      const { data, error } = await supabase.storage.from('jobsheets').createSignedUrl(sheet.quotationfilepath, 3600);
      if (error) console.warn('Quotation link unavailable:', error.message);
      jobsheet.quotationurl = data?.signedUrl || null;
    }
    return Response.json({ jobsheet, lines: linesRes.data || [] });
  } catch (error) { return approvalError(error); }
}