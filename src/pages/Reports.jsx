import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageLoader from '@/components/PageLoader';
import useStoreReport from '@/components/reports/useStoreReport';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportKpis from '@/components/reports/ReportKpis';
import ReportCharts from '@/components/reports/ReportCharts';
import ReportTableCard from '@/components/reports/ReportTableCard';
import ReportRequests from '@/components/reports/ReportRequests';

const issuedColumns = [['itemcode', 'Item Code'], ['itemname', 'Item Name'], ['qty', 'Quantity Issued']];
const stockColumns = [['itemcode', 'Item Code'], ['itemname', 'Item Name'], ['availableqty', 'Available Quantity'], ['minimumqty', 'Minimum Quantity']];
export default function Reports() {
  const report = useStoreReport();
  const data = report.data;
  return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
    <PageHeader title="Reports" subtitle="Inventory movement and operational reporting" icon={BarChart3} />
    <ReportFilters filters={report.filters} setFilters={report.setFilters} loading={report.loading} onApply={report.apply} />
    {report.loading ? <div role="status" aria-label="Loading report"><PageLoader /></div> : report.error ? <Card className="p-5 space-y-3"><h2 className="font-semibold">We couldn't load your report.</h2><p role="alert" className="text-sm text-muted-foreground break-words">{report.error}</p><Button variant="secondary" onClick={report.retry}>Retry</Button></Card> : data && <>
      <ReportKpis summary={data.summary} />
      <p className="text-xs text-muted-foreground">Dates filter requests and issued items using Singapore time. Team filters requests and job sheets. Low stock covers all inventory.</p>
      <ReportCharts data={data} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportTableCard title="Top issued items" columns={issuedColumns} rows={data.topIssuedItems} emptyMessage="No issued items for these filters." />
        <ReportTableCard title="Low stock items" columns={stockColumns} rows={data.lowStock} emptyMessage="No items are at or below their minimum stock level." />
      </div>
      <ReportRequests rows={data.requests} total={data.summary.totalRequests} />
    </>}
  </div>;
}