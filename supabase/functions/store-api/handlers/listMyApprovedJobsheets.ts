// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supervisorCaller, approvedSupervisorSheets, storeRows, storeError } from '../../_shared/supervisorStore.ts';

export default async function(req) {
  try {
    const caller = await supervisorCaller(req);
    const rows = await storeRows(() => approvedSupervisorSheets(caller).order('id', { ascending: false }));
    const jobsheets = rows.map(({ id, jobsheetno, projectname, teamcode }) => ({ id, jobsheetno, projectname, teamcode }));
    return Response.json({ jobsheets });
  } catch (error) { return storeError(error); }
}