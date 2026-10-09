import { format, isValid, parseISO } from 'date-fns';
import { titleCase } from '@/components/dashboard/dashboardFormat';
export { titleCase };
export const requestColumns = [['requestno', 'Request No'], ['jobsheetno', 'Job Sheet No'], ['teamcode', 'Team'], ['status', 'Status'], ['createddt', 'Created Date'], ['itemcount', 'Item Count']];
export function reportCell(key, value) {
  if (value == null || value === '') return '—';
  if (key === 'status') return titleCase(value);
  if (key === 'createddt') {
    const date = parseISO(String(value));
    return isValid(date) ? format(date, 'dd MMM yyyy') : String(value);
  }
  return String(value);
}
export function exportRequestsCsv(rows) {
  const escape = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const csv = [requestColumns.map(([, label]) => escape(label)).join(','), ...rows.map(row => requestColumns.map(([key]) => escape(key === 'createddt' || key === 'status' ? reportCell(key, row[key]) : row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = `store-requests-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}