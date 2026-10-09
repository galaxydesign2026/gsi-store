import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { storeErrorMessage } from '@/components/store/requestDisplay';

export default function useStoreData(functionName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke(functionName, {});
      if (res.data?.error) throw new Error(res.data.error);
      setData(res.data);
    } catch (e) { setError(storeErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [functionName]);
  return { data, loading, error, load };
}