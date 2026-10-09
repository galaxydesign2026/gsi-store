import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { requestColumns, reportCell } from '@/components/reports/reportFormat';

export default function ReportResultsTable({ results }) {
  return <Table><TableHeader><TableRow>{requestColumns.map(([key, label]) => <TableHead key={key} className="whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{results.map((row, index) => <TableRow key={row.requestno || index}>{requestColumns.map(([key]) => <TableCell key={key} className="whitespace-nowrap">{reportCell(key, row[key])}</TableCell>)}</TableRow>)}</TableBody>
  </Table>;
}