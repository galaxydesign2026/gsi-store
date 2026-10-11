import { useState } from 'react';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import { ClipboardCheck } from 'lucide-react';
import RequestQueuePanel from '@/components/requests/RequestQueuePanel';

// Director monitors item requests (read-only). Approvals stay with Store Admin, PE and Manager.
const MONITOR = {
  all: { label: 'All', statuses: undefined },
  approval: { label: 'In Approval', statuses: ['pending_store', 'pending_pe', 'pending_manager'] },
  issue: { label: 'Ready to Issue', statuses: ['approved', 'partially_issued'] },
  issued: { label: 'Issued', statuses: ['issued'] },
  closed: { label: 'Rejected / Cancelled', statuses: ['rejected', 'cancelled'] },
};

function DirectorRequestMonitor({ initialFilter }) {
  const [tab, setTab] = useState(MONITOR[initialFilter] ? initialFilter : 'all');
  return <>
    <Card className="mt-6 p-4 text-sm text-muted-foreground">
      Monitoring view — item requests are approved by Store Admin, Project Executive and Project Manager, then issued by Store Admin. Open any request to see its items and full approval trail.
    </Card>
    <div className="mt-4 flex flex-wrap gap-2">{Object.entries(MONITOR).map(([k, v]) =>
      <button key={k} type="button" onClick={() => setTab(k)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{v.label}</button>)}
    </div>
    <RequestQueuePanel key={tab} functionName="listStoreRequests" statuses={MONITOR[tab].statuses}
      title={`Item Requests — ${MONITOR[tab].label}`} readOnly />
  </>;
}

export default function ItemRequestApprovals({ role, initialFilter }) {
  return <div className="mx-auto max-w-6xl p-4 md:p-8">
    <PageHeader title="Approvals" subtitle={role === 'director' ? 'Item Request monitoring (all teams)' : 'Item Request review'} icon={ClipboardCheck} />
    {role === 'director'
      ? <DirectorRequestMonitor initialFilter={initialFilter} />
      : <RequestQueuePanel functionName="listRequestApprovals" title="Item Requests Pending My Approval" approval />}
  </div>;
}
