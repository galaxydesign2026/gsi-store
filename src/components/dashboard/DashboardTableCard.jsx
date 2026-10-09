import ChartCard from '@/components/dashboard/ChartCard';
import { titleCase, dashboardCell } from '@/components/dashboard/dashboardFormat';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function DashboardTableCard({ name, rows }) {
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))].slice(0, 6);
  return <ChartCard title={titleCase(name)}>
    <Table><TableHeader><TableRow>{columns.map(key => <TableHead key={key} className="whitespace-nowrap">{titleCase(key)}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.slice(0, 10).map((row, i) => <TableRow key={i}>{columns.map(key => <TableCell key={key} className="max-w-xs break-words text-xs">{dashboardCell(key, row[key])}</TableCell>)}</TableRow>)}</TableBody>
    </Table>
  </ChartCard>;
}