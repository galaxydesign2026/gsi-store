import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { storeErrorMessage } from '@/components/store/requestDisplay';

export default function useRequestAction(request, onSuccess) {
  const [remarks, setRemarks] = useState('');
  const [quantities, setQuantities] = useState(() => Object.fromEntries((request.requestitems || []).map(l => [l.id, Math.max(0, Number(l.qtyrequested) - Number(l.qtyissued))])));
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const items = () => (request.requestitems || []).map(l => ({ requestitemid: Number(l.id), qty: Number(quantities[l.id]) }));
  const prepare = next => {
    setError('');
    if (['reject', 'cancel'].includes(next) && !remarks.trim()) { setError(next === 'reject' ? 'Remarks are required to reject.' : 'Remarks are required to cancel.'); return; }
    if (next === 'issue') {
      if ((request.requestitems || []).some(l => quantities[l.id] === '' || !Number.isInteger(Number(quantities[l.id])) || Number(quantities[l.id]) < 0 || Number(quantities[l.id]) > Number(l.qtyrequested) - Number(l.qtyissued))) { setError('Issue quantities must be whole numbers between 0 and the remaining quantity.'); return; }
      if (!items().some(l => l.qty > 0)) { setError('Enter at least one quantity to issue.'); return; }
    }
    setAction(next);
  };
  const confirm = async () => {
    if (lock.current || !action) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const fn = action === 'issue' ? 'issueRequest' : action === 'cancel' ? 'cancelRequest' : 'actOnRequest';
      const payload = { requestid: request.id, ...(action === 'issue' ? { items: items().filter(l => l.qty > 0) } : { remarks: remarks.trim(), ...(action !== 'cancel' ? { action } : {}) }) };
      const { data } = await base44.functions.invoke(fn, payload);
      if (!data?.success) throw new Error(data?.error || 'Request action failed.');
      const messages = { approve: 'approved', reject: 'rejected', issue: 'items issued', cancel: 'cancelled' };
      toast.success(data.result?.message || `Request ${request.requestno} ${messages[action]}.`);
      setAction(null); onSuccess();
    } catch (e) { setAction(null); setError(storeErrorMessage(e)); toast.error(storeErrorMessage(e)); }
    finally { lock.current = false; setSaving(false); }
  };
  return { remarks, setRemarks, quantities, setQuantities, action, setAction, saving, error, prepare, confirm };
}