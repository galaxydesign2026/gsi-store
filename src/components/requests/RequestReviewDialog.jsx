import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { requestMeta } from '@/components/store/requestDisplay';
import useRequestAction from '@/components/requests/useRequestAction';
import RequestReviewLines from '@/components/requests/RequestReviewLines';
import RequestActionConfirmation from '@/components/requests/RequestActionConfirmation';
import RequestTrail from '@/components/requests/RequestTrail';

export default function RequestReviewDialog({ request, mode, onClose, onSuccess, showTrail = false }) {
  const r = useRequestAction(request, onSuccess);
  const issue = mode === 'issue';
  const review = mode === 'review';
  const meta = requestMeta(request.status);
  return <Dialog open onOpenChange={open => { if (!open && !r.saving && !r.action) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto" onEscapeKeyDown={e => { if (r.saving || r.action) e.preventDefault(); }} onPointerDownOutside={e => { if (r.saving || r.action) e.preventDefault(); }}>
      <DialogHeader><DialogTitle>{request.requestno}</DialogTitle><DialogDescription>{request.supervisorname} · Team: {request.teamcode || '—'} · Job Sheet: {request.jobsheetno || '—'}</DialogDescription></DialogHeader>
      <div><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></div>
      <RequestReviewLines lines={request.requestitems || []} issue={issue} quantities={r.quantities} setQuantities={r.setQuantities} disabled={r.saving || !!r.action} />
      {(review || issue) ? <div className="space-y-2"><Label htmlFor="request-remarks">Remarks{issue ? ' (required to cancel)' : ' (required to reject)'}</Label><Textarea id="request-remarks" value={r.remarks} disabled={r.saving || !!r.action} onChange={e => r.setRemarks(e.target.value)} /></div> : request.remarks && <p className="whitespace-pre-wrap text-sm text-muted-foreground">Remarks: {request.remarks}</p>}
      {showTrail && <RequestTrail requestId={request.id} />}
      {r.error && <p role="alert" className="text-sm text-destructive">{r.error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Button variant="tertiary" disabled={r.saving || !!r.action} onClick={onClose}>Close</Button>
        {review && <><Button variant="destructive" disabled={r.saving || !!r.action} onClick={() => r.prepare('reject')}>Reject</Button><Button variant="primary" disabled={r.saving || !!r.action} onClick={() => r.prepare('approve')}>Approve</Button></>}
        {issue && <><Button variant="destructive" disabled={r.saving || !!r.action} onClick={() => r.prepare('cancel')}>Cancel request</Button><Button variant="primary" disabled={r.saving || !!r.action} onClick={() => r.prepare('issue')}>Issue</Button></>}
      </div>
      <RequestActionConfirmation action={r.action} requestno={request.requestno} saving={r.saving} onCancel={() => r.setAction(null)} onConfirm={r.confirm} />
    </DialogContent>
  </Dialog>;
}