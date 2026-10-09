export default function DashboardStatusBadge({ status }) {
  const cfg = {
    pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700', returned: 'bg-blue-100 text-blue-700',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${cfg[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}