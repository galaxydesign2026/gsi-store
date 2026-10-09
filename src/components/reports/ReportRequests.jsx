import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/ui/table-pagination';
import ReportResultsTable from '@/components/reports/ReportResultsTable';
import ReportResultsMobile from '@/components/reports/ReportResultsMobile';
import { exportRequestsCsv } from '@/components/reports/reportFormat';

export default function ReportRequests({ rows, total }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const results = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return <Card className="overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary px-5 py-4 text-primary-foreground"><h2 className="font-semibold">Requests list</h2><Button variant="secondary" onClick={() => exportRequestsCsv(rows)} disabled={!rows.length}><Download />Export CSV</Button></div>
    {rows.length ? <><div className="hidden md:block"><ReportResultsTable results={results} /></div><div className="md:hidden"><ReportResultsMobile results={results} /></div></> : <p className="p-8 text-center text-sm text-muted-foreground">No requests match these filters. Try another date range or team.</p>}
    <TablePagination page={safePage} pageCount={pageCount} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={size => { setPageSize(size); setPage(1); }} total={total} />
  </Card>;
}