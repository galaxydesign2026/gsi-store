import { requestColumns, reportCell } from '@/components/reports/reportFormat';

export default function ReportResultsMobile({ results }) {
  return <div className="divide-y divide-border">{results.map((row, index) => <div key={row.requestno || index} className="p-4 space-y-3">
    <p className="font-semibold break-words">{row.requestno || '—'}</p>
    <dl className="grid grid-cols-2 gap-3 text-xs">{requestColumns.slice(1).map(([key, label]) => <div key={key} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{reportCell(key, row[key])}</dd></div>)}</dl>
  </div>)}</div>;
}