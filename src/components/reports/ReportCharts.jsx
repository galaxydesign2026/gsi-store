import ReportChartCard from '@/components/reports/ReportChartCard';
import { titleCase } from '@/components/reports/reportFormat';

const series = ['pending', 'approved', 'issued', 'rejected'].map(key => ({ key, label: titleCase(key) }));
export default function ReportCharts({ data }) {
  const byStatus = Object.entries(data.requestsByStatus).map(([key, count]) => ({ name: titleCase(key), count }));
  const byTeam = Object.entries(data.requestsByTeam).map(([name, counts]) => ({ name, ...counts }));
  const sheets = Object.entries(data.jobsheetsByStatus).map(([key, count]) => ({ name: titleCase(key), count }));
  return <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
    <ReportChartCard title="Requests by status" data={byStatus} donut />
    <ReportChartCard title="Requests by team" data={byTeam} series={series} />
    <ReportChartCard title="Job sheets by status" data={sheets} />
  </div>;
}