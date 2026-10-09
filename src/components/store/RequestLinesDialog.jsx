import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { requestMeta } from '@/components/store/requestDisplay';

export default function RequestLinesDialog({ request, onClose }) {
  const lines = request.requestitems || [];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto">
    <DialogHeader><DialogTitle>{request.requestno}</DialogTitle><DialogDescription>Job Sheet: {request.jobsheetno || '—'}</DialogDescription></DialogHeader>
    <Table><TableHeader><TableRow>{['Item Code', 'Item Name', 'Qty requested', 'Qty issued', 'Line status'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{lines.length ? lines.map(l => { const meta = requestMeta(l.linestatus); return <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.itemcode || '—'}</TableCell><TableCell className="font-medium">{l.itemname || '—'}</TableCell><TableCell>{l.qtyrequested}</TableCell><TableCell>{l.qtyissued}</TableCell><TableCell><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></TableCell></TableRow>; }) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No request lines.</TableCell></TableRow>}</TableBody>
    </Table>
    <div className="flex justify-end"><Button variant="tertiary" onClick={onClose}>Close</Button></div>
  </DialogContent></Dialog>;
}