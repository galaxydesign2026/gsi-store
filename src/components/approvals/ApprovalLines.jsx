import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatSGD } from '@/lib/jobsheetPdf';

export default function ApprovalLines({ lines, total }) {
  return <section className="space-y-3">
    <h3 className="text-sm font-semibold">Job Sheet Lines</h3>
    <div className="overflow-hidden rounded-xl border border-border">
      <Table><TableHeader><TableRow><TableHead>Supervisor</TableHead><TableHead>Trade</TableHead><TableHead>Scope</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
        <TableBody>{lines.length ? lines.map(l => <TableRow key={l.id}>
          <TableCell>{l.supervisorname || '—'}</TableCell><TableCell>{l.trade || '—'}</TableCell>
          <TableCell className="min-w-[180px] whitespace-pre-wrap break-words">{l.scope || '—'}</TableCell><TableCell className="whitespace-nowrap">{formatSGD(l.cost)}</TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No lines.</TableCell></TableRow>}</TableBody>
      </Table>
    </div>
    <p className="text-right font-semibold">Total: {formatSGD(total)}</p>
  </section>;
}