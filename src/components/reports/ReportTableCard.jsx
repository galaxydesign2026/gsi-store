import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { reportCell } from '@/components/reports/reportFormat';

export default function ReportTableCard({ title, columns, rows, emptyMessage, actions, children }) {
  return <Card className="min-w-0 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary px-5 py-4 text-primary-foreground"><h2 className="font-semibold">{title}</h2>{actions}</div>
    {rows.length ? <Table><TableHeader><TableRow>{columns.map(([key, label]) => <TableHead key={key} className="whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.map((row, index) => <TableRow key={row.requestno || row.itemcode || index}>{columns.map(([key]) => <TableCell key={key} className="text-sm whitespace-nowrap">{reportCell(key, row[key])}</TableCell>)}</TableRow>)}</TableBody>
    </Table> : <p className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>}
    {children}
  </Card>;
}