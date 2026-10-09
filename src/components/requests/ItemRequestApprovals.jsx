import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import { ClipboardCheck } from 'lucide-react';
import RequestQueuePanel from '@/components/requests/RequestQueuePanel';

export default function ItemRequestApprovals({ role }) {
  return <div className="mx-auto max-w-6xl p-4 md:p-8">
    <PageHeader title="Approvals" subtitle="Item Request review" icon={ClipboardCheck} />
    {role === 'director' ? <Card className="mt-6 p-6"><p className="text-sm text-muted-foreground">Item requests do not need Director approval.</p></Card> : <RequestQueuePanel functionName="listRequestApprovals" title="Item Requests Pending My Approval" approval />}
  </div>;
}