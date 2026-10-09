import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { storeErrorMessage } from '@/components/store/requestDisplay';

export default function useRequestQueue(functionName, statuses) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState({ requests: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data: result } = await base44.functions.invoke(functionName, { page, pageSize, ...(statuses ? { statuses } : {}) });
      if (result?.error) throw new Error(result.error);
      if (page > 1 && page > Math.max(1, Math.ceil(result.total / pageSize))) { setPage(Math.max(1, Math.ceil(result.total / pageSize))); return; }
      setData(result);
    } catch (e) { setError(storeErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [functionName, page, pageSize, statuses]);
  return { data, loading, error, load, page, pageSize, setPage, setPageSize: n => { setPage(1); setPageSize(n); } };
}