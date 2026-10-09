// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { approvalCaller, approvalStages, resolveApprovers, fail, approvalError } from '../../_shared/jobsheetApprovalAccess.ts';

export default async function(req) {
  try {
    const caller = await approvalCaller(req);
    const stage = approvalStages[caller.role];
    const pendingQuery = () => {
      const q = supabase.from('jobsheets').select('*', { count: 'exact' }).eq('status', stage.status);
      return caller.role === 'director' ? q.or(`assigneddirector.eq.${caller.id},assigneddirector.is.null`) : q.eq(stage.field, caller.id);
    };
    const [first, historyRes] = await Promise.all([
      pendingQuery().order('updateddt', { ascending: false }).order('id', { ascending: false }).range(0, 999),
      supabase.from('approvals').select('*', { count: 'exact' }).eq('workflowtype', 'jobsheet').eq('actedby', caller.id)
        .order('acteddt', { ascending: false }).order('id', { ascending: false }).limit(50),
    ]);
    if (first.error || historyRes.error) fail((first.error || historyRes.error).message);
    const sheets = [...(first.data || [])];
    for (let offset = sheets.length; offset < first.count;) {
      const page = await pendingQuery().order('updateddt', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 999);
      if (page.error) fail(page.error.message);
      if (!page.data?.length) break;
      sheets.push(...page.data);
      offset += page.data.length;
    }
    const pending = await resolveApprovers(sheets);
    return Response.json({ pending, history: historyRes.data || [], pendingCount: first.count || 0, historyCount: Math.min(historyRes.count || 0, 50), role: caller.role });
  } catch (error) { return approvalError(error); }
}