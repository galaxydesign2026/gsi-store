import { useState } from 'react';
import { ClipboardList, Hourglass, CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/page-header';
import PageLoader from '@/components/PageLoader';
import useStoreData from '@/components/store/useStoreData';
import StoreLoadError from '@/components/store/StoreLoadError';
import MyRequestsTable from '@/components/store/MyRequestsTable';
import RequestLinesDialog from '@/components/store/RequestLinesDialog';
import { REQUEST_STATUS_META } from '@/components/store/requestDisplay';

export default function MyRequests() {
  const { data, loading, error, load } = useStoreData('listMyRequests');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('all');
  if (loading) return <PageLoader />;
  const stats = data?.stats || {};
  const rows = (data?.requests || []).filter(r => status === 'all' || r.status === status);
  return <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
    <PageHeader title="My Requests" subtitle="Track stock requests and issued quantities." icon={ClipboardList} />
    {error ? <StoreLoadError error={error} retry={load} /> : <>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Hourglass} label="Pending" value={stats.pending || 0} sublabel="Awaiting review" tone="orange" />
        <StatCard icon={CheckCircle2} label="Approved/To issue" value={stats.approved || 0} sublabel="Ready or partially issued" tone="indigo" />
        <StatCard icon={PackageCheck} label="Issued" value={stats.issued || 0} sublabel="Fully issued" tone="emerald" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected || 0} sublabel="Not approved" tone="pink" />
      </div>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><p className="text-sm font-semibold">Requests</p><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-48" aria-label="Request status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(REQUEST_STATUS_META).filter(([key]) => key !== 'pending').map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label}</SelectItem>)}</SelectContent></Select></div>
        <MyRequestsTable key={status} requests={rows} onView={setSelected} />
      </Card>
    </>}
    {selected && <RequestLinesDialog request={selected} onClose={() => setSelected(null)} />}
  </div>;
}