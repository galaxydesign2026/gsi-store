import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { storeErrorMessage } from '@/components/store/requestDisplay';

const emptyFilters = { from: '', to: '', teamcode: '' };
export default function useStoreReport() {
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = async (input = filters) => {
    const current = ++sequence.current;
    setLoading(true); setError(''); setData(null);
    setApplied({ ...input });
    try {
      const response = await base44.functions.invoke('getStoreReport', input);
      if (response.data?.error) throw new Error(response.data.error);
      if (current === sequence.current) setData(response.data);
    } catch (e) { if (current === sequence.current) setError(storeErrorMessage(e)); }
    finally { if (current === sequence.current) setLoading(false); }
  };
  useEffect(() => { load(emptyFilters); return () => { sequence.current++; }; }, []);
  return { data, loading, error, filters, setFilters, apply: () => load(filters), retry: () => load(applied) };
}