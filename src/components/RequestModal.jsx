import { Loader2, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CartLines from '@/components/store/CartLines';
import useItemRequest from '@/components/store/useItemRequest';

export default function RequestModal({ cart, onChangeCart, onClose, onSubmitted }) {
  const r = useItemRequest(cart, onSubmitted);
  const jobsheets = r.sheets.data?.jobsheets || [];
  return <Dialog open onOpenChange={open => { if (!open && !r.saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto" onEscapeKeyDown={e => { if (r.saving) e.preventDefault(); }} onPointerDownOutside={e => { if (r.saving) e.preventDefault(); }}>
      <DialogHeader><DialogTitle>New Item Request</DialogTitle><DialogDescription>Select your approved job sheet and the quantities to request.</DialogDescription></DialogHeader>
      <form onSubmit={r.submit} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="request-jobsheet">Job Sheet <span className="text-destructive">*</span></Label>
          {r.sheets.loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading job sheets...</p> : r.sheets.error ? <div><p role="alert" className="text-sm text-destructive">{r.sheets.error}</p><Button type="button" variant="tertiary" onClick={r.sheets.load}>Retry</Button></div> : jobsheets.length ? <Select required value={r.jobsheetid} onValueChange={r.setJobsheetid} disabled={r.saving}>
            <SelectTrigger id="request-jobsheet"><SelectValue placeholder="Select Job Sheet" /></SelectTrigger><SelectContent>{jobsheets.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.jobsheetno} — {s.projectname}</SelectItem>)}</SelectContent>
          </Select> : <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">You are not on any approved job sheet yet.</p>}
        </div>
        <CartLines cart={cart} onChange={onChangeCart} disabled={r.saving} />
        {r.error && <p role="alert" className="text-sm text-destructive">{r.error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4"><Button type="button" variant="tertiary" disabled={r.saving} onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={r.saving || r.sheets.loading || !!r.sheets.error || !r.jobsheetid || !cart.length || !jobsheets.length}>{r.saving ? <Loader2 className="animate-spin" /> : <ShoppingCart />}{r.saving ? 'Submitting...' : 'Submit Request'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}