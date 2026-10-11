import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, PackageCheck, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { requestDate, storeErrorMessage } from '@/components/store/requestDisplay';

const STAGE = { store_admin: 'Store Admin', project_executive: 'Project Executive', team_manager: 'Project Manager', director: 'Director' };
const ACTION = {
  approve: { label: 'Approved', icon: CheckCircle2, cls: 'text-emerald-600' },
  reject: { label: 'Rejected', icon: XCircle, cls: 'text-red-600' },
  issue: { label: 'Issued', icon: PackageCheck, cls: 'text-blue-600' },
  cancel: { label: 'Cancelled', icon: Ban, cls: 'text-slate-500' },
};

// Read-only approval history for one item request (Director / Store Admin).
export default function RequestTrail({ requestId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    base44.functions.invoke('getRequestTrail', { requestid: requestId })
      .then(({ data }) => live && setRows(data?.trail || []))
      .catch(e => live && setError(storeErrorMessage(e)));
    return () => { live = false; };
  }, [requestId]);
  return <div className="rounded-xl border border-border p-4">
    <p className="mb-3 text-sm font-semibold">Approval trail</p>
    {error ? <p className="text-sm text-destructive">{error}</p>
      : rows === null ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
      : !rows.length ? <p className="text-sm text-muted-foreground">No actions yet — waiting for Store Admin review.</p>
      : <ol className="space-y-3">{rows.map(t => {
          const a = ACTION[t.action] || { label: t.action, icon: CheckCircle2, cls: 'text-muted-foreground' };
          const Icon = a.icon;
          return <li key={t.id} className="flex gap-3">
            <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${a.cls}`} />
            <div className="min-w-0 text-sm">
              <p><span className="font-medium">{a.label}</span> by {t.actedbyname || '—'} <span className="text-muted-foreground">({STAGE[t.stagecode] || t.stagecode})</span></p>
              <p className="text-xs text-muted-foreground">{requestDate(t.acteddt)}</p>
              {t.remarks && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">“{t.remarks}”</p>}
            </div>
          </li>;
        })}</ol>}
  </div>;
}
