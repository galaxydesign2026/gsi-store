import { format, parseISO, isValid } from 'date-fns';
import { formatSGD } from '@/lib/jobsheetPdf';

export const titleCase = key => String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isNumber = value => typeof value === 'number' && Number.isFinite(value);
export function dashboardKind(value) {
  if (isNumber(value)) return 'kpi';
  if (Array.isArray(value) && value.length && value.every(isObject) && value.some(row => Object.keys(row).length)) return 'table';
  if (isObject(value) && Object.keys(value).length && Object.values(value).every(isNumber)) return 'chart';
  return null;
}
export function dashboardCell(key, value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:$|[T ])/.test(value)) {
    const date = parseISO(value);
    if (isValid(date)) return format(date, 'dd MMM yyyy');
  }
  if (/amount|total|cost/i.test(key) && (isNumber(value) || (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))))) return formatSGD(Number(value));
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}