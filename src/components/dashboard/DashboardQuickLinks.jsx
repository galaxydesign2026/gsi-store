import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const links = {
  supervisor: [['Store Items', '/items'], ['My Requests', '/my-requests']],
  project_executive: [['Approvals', '/approvals']],
  team_manager: [['Approvals', '/approvals']],
  director: [['Approvals', '/approvals']],
  team_admin: [['Job Sheets', '/job-sheets']],
  store_admin: [['Requests', '/requests'], ['Inventory', '/inventory']],
};
export default function DashboardQuickLinks({ role }) {
  const items = links[role] || [];
  if (!items.length) return null;
  return <nav aria-label="Dashboard quick links" className="flex flex-wrap gap-2">{items.map(([label, to]) => <Button key={to} asChild variant="secondary"><Link to={to}>{label}<ArrowRight /></Link></Button>)}</nav>;
}