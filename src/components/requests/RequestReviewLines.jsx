import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function RequestReviewLines({ lines, issue, quantities, setQuantities, disabled }) {
  return <Table><TableHeader><TableRow><TableHead>Item Code</TableHead><TableHead>Item Name</TableHead><TableHead>Qty requested</TableHead><TableHead>Qty issued</TableHead>{issue && <TableHead>Issue qty</TableHead>}</TableRow></TableHeader>
    <TableBody>{lines.length ? lines.map(l => {
      const remaining = Math.max(0, Number(l.qtyrequested) - Number(l.qtyissued));
      return <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.itemcode}</TableCell><TableCell className="font-medium">{l.itemname}</TableCell><TableCell>{l.qtyrequested}</TableCell><TableCell>{l.qtyissued}</TableCell>{issue && <TableCell><Input aria-label={`Issue quantity for ${l.itemname}`} className="w-24" type="number" min={0} max={remaining} step={1} disabled={disabled || remaining === 0} value={quantities[l.id]} onChange={e => setQuantities(prev => ({ ...prev, [l.id]: e.target.value }))} /><p className="mt-1 text-xs text-muted-foreground">Remaining: {remaining}</p></TableCell>}</TableRow>;
    }) : <TableRow><TableCell colSpan={issue ? 5 : 4} className="py-8 text-center text-muted-foreground">No request lines.</TableCell></TableRow>}</TableBody>
  </Table>;
}