import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { errorMessage, getStatusMeta } from '@/components/approvals/approvalDisplay';

export default function useApprovalReview(id, onClose, onSuccess) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    base44.functions.invoke('getApprovalJobsheet', { jobsheetid: id }).then(res => {
      if (res.data?.error) throw new Error(res.data.error);
      if (active) setDetail(res.data);
    }).catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [id]);
  const requestAction = next => {
    if (locked.current) return;
    if (next === 'reject' && !remarks.trim()) { setError('Remarks are required to reject.'); return; }
    setError(''); setAction(next);
  };
  const confirm = async () => {
    if (locked.current || !action) return;
    locked.current = true; setSaving(true); setError('');
    try {
      const { data } = await base44.functions.invoke('actOnJobsheet', { jobsheetid: id, action, remarks: remarks.trim() });
      if (!data?.success) throw new Error(data?.error || 'Failed to save approval.');
      const result = Array.isArray(data.result) ? data.result[0] : data.result;
      const next = data.nextStatus || result?.next_status || result?.tostatus || result?.status;
      toast.success(action === 'reject' ? 'Rejected' : next ? `Approved — moved to ${getStatusMeta(next).label}` : 'Approved');
      onClose(); onSuccess();
    } catch (e) { setError(errorMessage(e)); toast.error(errorMessage(e)); setAction(null); }
    finally { locked.current = false; setSaving(false); }
  };
  return { detail, error, remarks, setRemarks, action, setAction, saving, requestAction, confirm };
}