import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RequestQueuePanel from '@/components/requests/RequestQueuePanel';

const QUEUES = {
  review: { label: 'To Review', statuses: ['pending_store'] },
  approval: { label: 'In Approval', statuses: ['pending_pe', 'pending_manager'] },
  issue: { label: 'Ready to Issue', statuses: ['approved', 'partially_issued'] },
  completed: { label: 'Completed', statuses: ['issued', 'rejected', 'cancelled'] },
};

export default function Requests() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(QUEUES[params.get('tab')] ? params.get('tab') : 'review');
  return <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
    <PageHeader title="Item Requests" subtitle="Review stock requests, issue items, and track completion." icon={ClipboardList} />
    <Tabs value={tab} onValueChange={setTab} className="mt-6"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:w-fit">{Object.entries(QUEUES).map(([key, q]) => <TabsTrigger key={key} value={key}>{q.label}</TabsTrigger>)}</TabsList></Tabs>
    <RequestQueuePanel key={tab} functionName="listStoreRequests" statuses={QUEUES[tab].statuses} title={QUEUES[tab].label} />
  </div>;
}