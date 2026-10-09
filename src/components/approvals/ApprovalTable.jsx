import { useState } from 'react';
import { Eye, Inbox } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableCard, EmptyState } from '@/components/ui/data-table';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatSGD } from '@/lib/jobsheetPdf';
import { getStatusMeta, formatDate, pickDate } from '@/components/approvals/approvalDisplay';

export default function ApprovalTable({ rows, history = false, onReview }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  if (!rows.length) return <EmptyState icon={Inbox} title={history ? 'No approval history yet.' : 'No job sheets waiting for your approval.'} />;
  return <>
    <DataTableCard className="rounded-none border-0 shadow-none"><Table>
      <TableHeader><TableRow className="border-b-0 hover:bg-transparent">
        {(history ? ['Job Sheet No', 'Stage', 'Action', 'Remarks', 'Date'] : ['Job Sheet No', 'Project', 'Team', 'Total', 'Submitted/Updated date', 'Status', 'Action']).map(h => <TableHead key={h}>{h}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>{visible.map(s => {
        const meta = getStatusMeta(s.status);
        return <TableRow key={s.id}>
          <TableCell className="font-mono text-xs font-medium">{(history ? s.refno : s.jobsheetno) || '—'}</TableCell>
          {history ? <>
            <TableCell>{s.stagecode || '—'}</TableCell>
            <TableCell><StatusBadge tone={s.action === 'approve' ? 'success' : s.action === 'reject' ? 'danger' : 'neutral'}>{s.action}</StatusBadge></TableCell>
            <TableCell className="min-w-[180px] max-w-sm whitespace-pre-wrap break-words">{s.remarks || '—'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(s.acteddt)}</TableCell>
          </> : <>
            <TableCell className="font-medium">{s.projectname || '—'}</TableCell><TableCell className="text-muted-foreground">{s.teamcode || '—'}</TableCell>
            <TableCell className="whitespace-nowrap font-medium">{formatSGD(s.totalcost)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(pickDate(s))}</TableCell>
            <TableCell><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></TableCell>
            <TableCell><Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onReview(s.id)}><Eye className="h-3.5 w-3.5" />Review</Button></TableCell>
          </>}
        </TableRow>;
      })}</TableBody>
    </Table></DataTableCard>
    <TablePagination page={current} pageCount={pageCount} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={n => { setPageSize(n); setPage(1); }} total={rows.length} />
  </>;
}