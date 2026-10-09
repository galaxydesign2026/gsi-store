import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { errorMessage } from '@/components/approvals/approvalDisplay';

export default function useApprovals() {
  const [data, setData] = useState({ pending: [], history: [], pendingCount: 0, historyCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('listJobsheetApprovals', {});
      if (res.data?.error) throw new Error(res.data.error);
      setData(res.data);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return { data, loading, error, load };
}