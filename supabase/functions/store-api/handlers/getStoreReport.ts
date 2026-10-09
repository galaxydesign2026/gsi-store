// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { requestCaller, requestFailure, failRequest } from '../../_shared/requestWorkflow.ts';
import { storeRows } from '../../_shared/supervisorStore.ts';

const pendingStatuses = ['pending_store', 'pending_pe', 'pending_manager'];
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function counts(rows) {
  const result = Object.create(null);
  for (const row of rows) {
    const status = row.status || 'unknown';
    result[status] = (result[status] || 0) + 1;
  }
  return result;
}

export default async function(req) {
  try {
    await requestCaller(req, ['director']);
    const { from, to, teamcode } = await req.json();
    if ((from && !validDate(from)) || (to && !validDate(to))) failRequest('Dates must be valid dates in yyyy-mm-dd format.');
    if (from && to && from > to) failRequest('From date must be on or before To date.');
    if (teamcode && !['GSIA', 'GSIB', 'GSID'].includes(teamcode)) failRequest('Choose GSIA, GSIB, GSID, or All teams.');
    const until = to ? new Date(Date.parse(to) + 86400000).toISOString().slice(0, 10) : null;
    const [requestRows, sheets, inventory] = await Promise.all([
      storeRows(() => {
        let query = supabase.from('requests').select('id,requestno,jobsheetno,teamcode,status,createddt,requestitems(itemcode,itemname,qtyissued)', { count: 'exact' });
        if (from) query = query.gte('createddt', `${from}T00:00:00+08:00`);
        if (until) query = query.lt('createddt', `${until}T00:00:00+08:00`);
        if (teamcode) query = query.eq('teamcode', teamcode);
        return query.order('createddt', { ascending: false }).order('id', { ascending: false });
      }),
      storeRows(() => {
        let query = supabase.from('jobsheets').select('id,status', { count: 'exact' });
        if (teamcode) query = query.eq('teamcode', teamcode);
        return query.order('id');
      }),
      storeRows(() => supabase.from('inventoryitems').select('id,itemcode,itemname,availableqty,minimumqty', { count: 'exact' }).order('itemcode').order('id')),
    ]);
    const requestsByStatus = counts(requestRows);
    const jobsheetsByStatus = counts(sheets);
    const requestsByTeam = Object.create(null);
    const issuedItems = new Map();
    for (const request of requestRows) {
      const team = request.teamcode || 'Unassigned';
      if (!requestsByTeam[team]) requestsByTeam[team] = { pending: 0, approved: 0, issued: 0, rejected: 0 };
      const status = pendingStatuses.includes(request.status) ? 'pending' : request.status;
      if (Object.hasOwn(requestsByTeam[team], status)) requestsByTeam[team][status]++;
      for (const line of request.requestitems || []) {
        const qty = Number(line.qtyissued) || 0;
        if (qty <= 0) continue;
        const key = line.itemcode;
        const item = issuedItems.get(key) || { itemcode: key, itemname: line.itemname, qty: 0 };
        item.qty += qty;
        issuedItems.set(key, item);
      }
    }
    const topIssuedItems = [...issuedItems.values()].sort((a, b) => b.qty - a.qty || String(a.itemcode).localeCompare(String(b.itemcode))).slice(0, 10);
    const lowStock = inventory.filter(item => item.availableqty != null && item.minimumqty != null && Number(item.availableqty) <= Number(item.minimumqty))
      .map(({ itemcode, itemname, availableqty, minimumqty }) => ({ itemcode, itemname, availableqty, minimumqty }));
    const requests = requestRows.map(({ requestno, jobsheetno, teamcode, status, createddt, requestitems }) => ({ requestno, jobsheetno, teamcode, status, createddt, itemcount: (requestitems || []).length }));
    const summary = {
      totalRequests: requestRows.length,
      pending: pendingStatuses.reduce((sum, status) => sum + (requestsByStatus[status] || 0), 0),
      issued: requestsByStatus.issued || 0,
      approvedJobsheets: jobsheetsByStatus.approved || 0,
      lowStockItems: lowStock.length,
    };
    return Response.json({ requestsByStatus, requestsByTeam, jobsheetsByStatus, topIssuedItems, lowStock, requests, summary });
  } catch (error) { return requestFailure(error); }
}