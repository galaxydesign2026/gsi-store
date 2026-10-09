import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import useStoreData from '@/components/store/useStoreData';
import { storeErrorMessage } from '@/components/store/requestDisplay';

export default function useItemRequest(cart, onSubmitted) {
  const sheets = useStoreData('listMyApprovedJobsheets');
  const [jobsheetid, setJobsheetid] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async e => {
    e.preventDefault();
    if (lock.current) return;
    if (!jobsheetid) { setError('Select a Job Sheet.'); return; }
    if (!cart.length) { setError('Add at least one item.'); return; }
    if (cart.some(l => !Number.isInteger(Number(l.qty)) || Number(l.qty) < 1 || Number(l.qty) > Number(l.availableqty))) {
      setError('Each quantity must be a whole number between 1 and the available quantity.'); return;
    }
    lock.current = true; setSaving(true); setError('');
    try {
      const { data } = await base44.functions.invoke('submitItemRequest', { jobsheetid: Number(jobsheetid), items: cart.map(l => ({ itemid: Number(l.id), qty: Number(l.qty) })) });
      if (!data?.success) throw new Error(data?.error || 'Request failed.');
      const result = Array.isArray(data.result) ? data.result[0] : data.result;
      toast.success(`Request ${result?.requestno || ''} submitted — stock reserved, waiting for Store Admin.`);
      onSubmitted();
    } catch (e) { setError(storeErrorMessage(e)); toast.error(storeErrorMessage(e)); }
    finally { lock.current = false; setSaving(false); }
  };
  return { sheets, jobsheetid, setJobsheetid, saving, error, submit };
}