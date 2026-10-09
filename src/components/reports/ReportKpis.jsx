import { ClipboardList, Clock, PackageCheck, CheckCircle, PackageX } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export default function ReportKpis({ summary }) {
  const items = [
    ['Total requests', summary.totalRequests, ClipboardList, 'indigo'],
    ['Pending', summary.pending, Clock, 'orange'],
    ['Issued', summary.issued, PackageCheck, 'emerald'],
    ['Job sheets approved', summary.approvedJobsheets, CheckCircle, 'indigo'],
    ['Low-stock items', summary.lowStockItems, PackageX, 'pink'],
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">{items.map(([label, value, icon, tone]) => <StatCard key={label} label={label} value={Number(value || 0).toLocaleString('en-SG')} icon={icon} tone={tone} />)}</div>;
}