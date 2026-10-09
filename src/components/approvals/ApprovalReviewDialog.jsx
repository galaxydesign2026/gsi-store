import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ApprovalDetails from '@/components/approvals/ApprovalDetails';
import ApprovalLines from '@/components/approvals/ApprovalLines';
import ApprovalConfirmation from '@/components/approvals/ApprovalConfirmation';
import useApprovalReview from '@/components/approvals/useApprovalReview';

export default function ApprovalReviewDialog({ id, onClose, onSuccess }) {
  const r = useApprovalReview(id, onClose, onSuccess);
  return <>
    <Dialog open onOpenChange={open => { if (!open && !r.saving) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto" onEscapeKeyDown={e => { if (r.saving) e.preventDefault(); }} onPointerDownOutside={e => { if (r.saving) e.preventDefault(); }}>
        <DialogHeader><DialogTitle>Review Job Sheet</DialogTitle><DialogDescription>Review the details and quotation before approving or rejecting.</DialogDescription></DialogHeader>
        {!r.detail && !r.error && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {r.detail && <div className="space-y-6">
          <ApprovalDetails sheet={r.detail.jobsheet} />
          <ApprovalLines lines={r.detail.lines} total={r.detail.jobsheet.totalcost} />
          <div className="space-y-2"><Label htmlFor="approval-remarks">Remarks (required to reject)</Label><Textarea id="approval-remarks" value={r.remarks} onChange={e => r.setRemarks(e.target.value)} disabled={r.saving} placeholder="Enter your remarks..." /></div>
        </div>}
        {r.error && <p role="alert" className="text-sm text-destructive">{r.error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button variant="tertiary" disabled={r.saving} onClick={onClose}>Close</Button>
          {r.detail && <><Button variant="primary" disabled={r.saving || !!r.action} onClick={() => r.requestAction('approve')}><CheckCircle2 />Approve</Button><Button variant="destructive" disabled={r.saving || !!r.action} onClick={() => r.requestAction('reject')}><XCircle />Reject</Button></>}
        </div>
      </DialogContent>
    </Dialog>
    <ApprovalConfirmation action={r.action} sheetNo={r.detail?.jobsheet.jobsheetno} saving={r.saving} onCancel={() => r.setAction(null)} onConfirm={r.confirm} />
  </>;
}