// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { supervisorCaller, storeRows, storeFail, storeError } from '../../_shared/supervisorStore.ts';

export default async function(req) {
  try {
    const caller = await supervisorCaller(req);
    const count = statuses => supabase.from('requests').select('id', { count: 'exact', head: true })
      .eq('supervisorid', caller.id).in('status', statuses);
    const [requests, pending, approved, issued, rejected] = await Promise.all([
      storeRows(() => supabase.from('requests')
        .select('*, requestitems(id, itemcode, itemname, qtyrequested, qtyissued, linestatus)', { count: 'exact' })
        .eq('supervisorid', caller.id).order('createddt', { ascending: false }).order('id', { ascending: false })
        .order('id', { referencedTable: 'requestitems', ascending: true })),
      count(['pending_store', 'pending_pe', 'pending_manager']),
      count(['approved', 'partially_issued']), count(['issued']), count(['rejected']),
    ]);
    for (const r of [pending, approved, issued, rejected]) if (r.error) storeFail(r.error.message);
    return Response.json({ requests, stats: { pending: pending.count, approved: approved.count, issued: issued.count, rejected: rejected.count } });
  } catch (error) { return storeError(error); }
}