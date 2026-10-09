import { useState } from 'react';
import { ClipboardCheck, Hourglass, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import PageLoader from '@/components/PageLoader';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ApprovalTable from '@/components/approvals/ApprovalTable';
import ApprovalReviewDialog from '@/components/approvals/ApprovalReviewDialog';
import useApprovals from '@/components/approvals/useApprovals';
import { stageLabels } from '@/components/approvals/approvalDisplay';
import { getGsiUser } from '@/lib/gsiUser';
import { normalizeRole } from '@/lib/roles';

export default function JobSheetApprovalPanel() {
  const { data, loading, error, load } = useApprovals();
  const [tab, setTab] = useState('pending');
  const [reviewId, setReviewId] = useState(null);
  const role = data.role || normalizeRole(getGsiUser()?.role);
  if (loading) return <PageLoader />;
  return <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
    <PageHeader title="Approvals" subtitle={stageLabels[role] || 'Job Sheet review'} icon={ClipboardCheck} />
    {error ? <Card className="mt-6 space-y-3 p-6"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="secondary" onClick={load}>Retry</Button></Card> : <>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <StatCard icon={Hourglass} label="Pending my approval" value={data.pendingCount} sublabel="Awaiting review" tone="orange" />
        <StatCard icon={CheckCircle2} label="Actioned by me" value={data.historyCount} sublabel="Latest 50 actions" tone="emerald" />
      </div>
      <Card className="mt-6 overflow-hidden p-0">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="h-5 w-5" /></span><p className="text-sm font-semibold">Job Sheet Approvals</p></div>
            <TabsList><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          </div>
          <TabsContent value="pending" className="mt-0"><ApprovalTable rows={data.pending} onReview={setReviewId} /></TabsContent>
          <TabsContent value="history" className="mt-0"><ApprovalTable rows={data.history} history /></TabsContent>
        </Tabs>
      </Card>
    </>}
    {reviewId != null && <ApprovalReviewDialog key={reviewId} id={reviewId} onClose={() => setReviewId(null)} onSuccess={load} />}
  </div>;
}