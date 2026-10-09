// @ts-nocheck — ported from Base44 (plain JS semantics)
import { supabase } from '../../_shared/supabaseClient.ts';
import { supervisorCaller, storeRows, storeError } from '../../_shared/supervisorStore.ts';

export default async function(req) {
  try {
    await supervisorCaller(req);
    const items = await storeRows(() => supabase.from('inventoryitems')
      .select('id, itemcode, itemname, category, brand, model, description, availableqty', { count: 'exact' })
      .order('itemname').order('id'));
    return Response.json({ items });
  } catch (error) { return storeError(error); }
}