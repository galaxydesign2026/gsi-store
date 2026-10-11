import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { Loader2 } from 'lucide-react';
import StoreLoadError from '@/components/store/StoreLoadError';
import useRequestQueue from '@/components/requests/useRequestQueue';
import RequestQueueTable from '@/components/requests/RequestQueueTable';
import RequestReviewDialog from '@/components/requests/RequestReviewDialog';

export default function RequestQueuePanel({ functionName, statuses, title, approval = false, readOnly = false }) {
  const q = useRequestQueue(functionName, statuses);
  const [selected, setSelected] = useState(null);
  const mode = readOnly ? 'view' : approval || selected?.status === 'pending_store' ? 'review' : ['approved', 'partially_issued'].includes(selected?.status) ? 'issue' : 'view';
  const success = () => { setSelected(null); q.load(); };
  return <>
    {q.error ? <StoreLoadError error={q.error} retry={q.load} /> : <Card className="mt-6 overflow-hidden p-0">
      <div className="border-b border-border p-4"><p className="text-sm font-semibold">{title}</p></div>
      {q.loading ? <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading requests...</div> : <><RequestQueueTable rows={q.data.requests || []} onView={setSelected} /><TablePagination page={q.page} pageSize={q.pageSize} pageCount={Math.max(1, Math.ceil(q.data.total / q.pageSize))} total={q.data.total} onPageChange={q.setPage} onPageSizeChange={q.setPageSize} /></>}
    </Card>}
    {selected && <RequestReviewDialog key={selected.id} request={selected} mode={mode} showTrail={readOnly} onClose={() => setSelected(null)} onSuccess={success} />}
  </>;
}