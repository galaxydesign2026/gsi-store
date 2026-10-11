// =====================================================================
// store-api — single Edge Function router for GSI Store Management.
// Browser calls: POST /functions/v1/store-api  { fn: "<handlerName>", payload: {...} }
// Each handler is the ported Base44 function (same name, same input/output).
// Auth: the caller's Supabase JWT is passed through to the handler unchanged;
//       identity is verified inside each handler (see _shared/base44compat.ts).
// =====================================================================
import { corsHeaders } from '../_shared/cors.ts';
import actOnJobsheet from './handlers/actOnJobsheet.ts';
import actOnRequest from './handlers/actOnRequest.ts';
import cancelRequest from './handlers/cancelRequest.ts';
import checkActive from './handlers/checkActive.ts';
import createUserRecord from './handlers/createUserRecord.ts';
import deleteInventoryItem from './handlers/deleteInventoryItem.ts';
import deleteJobsheet from './handlers/deleteJobsheet.ts';
import getAllInventory from './handlers/getAllInventory.ts';
import getAllUsers from './handlers/getAllUsers.ts';
import getApprovalJobsheet from './handlers/getApprovalJobsheet.ts';
import getJobsheet from './handlers/getJobsheet.ts';
import getJobsheetDropdowns from './handlers/getJobsheetDropdowns.ts';
import getMyDashboard from './handlers/getMyDashboard.ts';
import getRequestTrail from './handlers/getRequestTrail.ts';
import getStoreReport from './handlers/getStoreReport.ts';
import getTeams from './handlers/getTeams.ts';
import issueRequest from './handlers/issueRequest.ts';
import listJobSheets from './handlers/listJobSheets.ts';
import listJobsheetApprovals from './handlers/listJobsheetApprovals.ts';
import listMyApprovedJobsheets from './handlers/listMyApprovedJobsheets.ts';
import listMyRequests from './handlers/listMyRequests.ts';
import listRequestApprovals from './handlers/listRequestApprovals.ts';
import listStoreItems from './handlers/listStoreItems.ts';
import listStoreRequests from './handlers/listStoreRequests.ts';
import saveInventoryItem from './handlers/saveInventoryItem.ts';
import saveJobsheet from './handlers/saveJobsheet.ts';
import setUserActive from './handlers/setUserActive.ts';
import submitItemRequest from './handlers/submitItemRequest.ts';
import submitJobsheet from './handlers/submitJobsheet.ts';
import updateUserRecord from './handlers/updateUserRecord.ts';
import uploadQuotation from './handlers/uploadQuotation.ts';
import validateUser from './handlers/validateUser.ts';

type Handler = (req: Request) => Promise<Response>;
const HANDLERS: Record<string, Handler> = {
  actOnJobsheet,
  actOnRequest,
  cancelRequest,
  checkActive,
  createUserRecord,
  deleteInventoryItem,
  deleteJobsheet,
  getAllInventory,
  getAllUsers,
  getApprovalJobsheet,
  getJobsheet,
  getJobsheetDropdowns,
  getMyDashboard,
  getRequestTrail,
  getStoreReport,
  getTeams,
  issueRequest,
  listJobSheets,
  listJobsheetApprovals,
  listMyApprovedJobsheets,
  listMyRequests,
  listRequestApprovals,
  listStoreItems,
  listStoreRequests,
  saveInventoryItem,
  saveJobsheet,
  setUserActive,
  submitItemRequest,
  submitJobsheet,
  updateUserRecord,
  uploadQuotation,
  validateUser,
};

const withCors = (res: Response) => {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { fn, payload } = await req.json();
    const handler = HANDLERS[String(fn || '')];
    if (!handler) return withCors(Response.json({ error: `Unknown function: ${fn}` }, { status: 404 }));
    const inner = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(payload ?? {}),
    });
    return withCors(await handler(inner));
  } catch (error) {
    return withCors(Response.json({ error: (error as Error).message }, { status: 500 }));
  }
});
