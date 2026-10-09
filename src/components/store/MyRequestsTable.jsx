import { useState } from 'react';
import { ClipboardList, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableCard, EmptyState } from '@/components/ui/data-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { requestMeta, requestDate } from '@/components/store/requestDisplay';

export default function MyRequestsTable({ requests, onView }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(requests.length / pageSize));
  const current = Math.min(page, pageCount);
  if (!requests.length) return <EmptyState icon={ClipboardList} title="No requests yet" description="Submit a request from Store Items to see it here." />;
  return <>
    <DataTableCard className="rounded-none border-0 shadow-none"><Table>
      <TableHeader><TableRow className="border-b-0 hover:bg-transparent">{['Request No', 'Job Sheet No', 'Status', 'Date', 'Item count', 'Action'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{requests.slice((current - 1) * pageSize, current * pageSize).map(r => { const meta = requestMeta(r.status); return <TableRow key={r.id}>
        <TableCell className="font-mono text-xs font-medium">{r.requestno}</TableCell><TableCell>{r.jobsheetno || '—'}</TableCell><TableCell><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></TableCell>
        <TableCell className="text-xs text-muted-foreground">{requestDate(r.createddt)}</TableCell><TableCell>{r.requestitems?.length || 0}</TableCell>
        <TableCell><Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onView(r)}><Eye className="h-3.5 w-3.5" />View</Button></TableCell>
      </TableRow>; })}</TableBody>
    </Table></DataTableCard>
    <TablePagination page={current} pageCount={pageCount} pageSize={pageSize} total={requests.length} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
  </>;
}