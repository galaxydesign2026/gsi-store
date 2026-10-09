import { ClipboardList, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableCard, EmptyState } from '@/components/ui/data-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { requestDate, requestMeta } from '@/components/store/requestDisplay';

export default function RequestQueueTable({ rows, onView }) {
  if (!rows.length) return <EmptyState icon={ClipboardList} title="No requests found" description="There are no item requests in this queue." />;
  return <DataTableCard className="rounded-none border-0 shadow-none"><Table>
    <TableHeader><TableRow>{['Request No', 'Supervisor', 'Team', 'Job Sheet No', 'Status', 'Date', 'Action'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.map(r => { const meta = requestMeta(r.status); return <TableRow key={r.id}><TableCell className="font-mono text-xs font-medium">{r.requestno}</TableCell><TableCell>{r.supervisorname}</TableCell><TableCell>{r.teamcode || '—'}</TableCell><TableCell>{r.jobsheetno || '—'}</TableCell><TableCell><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></TableCell><TableCell className="text-xs text-muted-foreground">{requestDate(r.createddt)}</TableCell><TableCell><Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onView(r)}><Eye className="h-3.5 w-3.5" />View</Button></TableCell></TableRow>; })}</TableBody>
  </Table></DataTableCard>;
}