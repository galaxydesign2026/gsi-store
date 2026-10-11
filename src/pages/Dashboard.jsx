import { useState } from 'react';
import { Package, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { getGsiUser } from '@/lib/gsiUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageLoader from '@/components/PageLoader';
import useStoreData from '@/components/store/useStoreData';
import DashboardWelcome from '@/components/dashboard/DashboardWelcome';
import KpiCard from '@/components/dashboard/KpiCard';
import DashboardQuickLinks from '@/components/dashboard/DashboardQuickLinks';
import DashboardTableCard from '@/components/dashboard/DashboardTableCard';
import DashboardBarCard from '@/components/dashboard/DashboardBarCard';
import { dashboardKind, isObject, titleCase } from '@/components/dashboard/dashboardFormat';
import { kpiLink } from '@/components/dashboard/kpiLinks';
export { default as StatusBadge } from '@/components/dashboard/DashboardStatusBadge';

const gradients = ['bg-gradient-to-br from-blue-500 to-blue-700', 'bg-gradient-to-br from-amber-400 to-orange-500', 'bg-gradient-to-br from-emerald-500 to-green-700', 'bg-gradient-to-br from-purple-500 to-violet-700'];
const icons = [Package, Clock, CheckCircle, TrendingUp];

export default function Dashboard() {
  const [profile] = useState(() => getGsiUser());
  const q = useStoreData('getMyDashboard');
  const role = q.data?.role || profile?.role || '';
  const entries = isObject(q.data?.data) ? Object.entries(q.data.data).map(([key, value]) => ({ key, value, kind: dashboardKind(value) })).filter(entry => entry.kind) : [];
  const kpis = entries.filter(entry => entry.kind === 'kpi');
  const cards = entries.filter(entry => entry.kind !== 'kpi');
  return <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in space-y-5">
    <DashboardWelcome profile={profile} role={role} />
    {q.loading ? <div role="status" aria-label="Loading dashboard"><PageLoader /></div> : q.error ? <Card className="space-y-3 rounded-2xl p-5"><h2 className="font-semibold">We couldn't load your dashboard.</h2><p role="alert" className="break-words text-sm text-muted-foreground">{q.error}</p><Button variant="secondary" onClick={q.load}>Retry</Button></Card> : <>
      {kpis.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{kpis.map((entry, i) => <KpiCard key={entry.key} icon={icons[i % icons.length]} label={titleCase(entry.key)} value={entry.value.toLocaleString('en-SG')} gradient={gradients[i % gradients.length]} to={kpiLink(role, entry.key)} />)}</div>}
      <DashboardQuickLinks role={role} />
      {cards.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{cards.map(entry => entry.kind === 'table' ? <DashboardTableCard key={entry.key} name={entry.key} rows={entry.value} /> : <DashboardBarCard key={entry.key} name={entry.key} values={entry.value} />)}</div>}
      {!entries.length && <Card className="rounded-2xl p-5 text-sm text-muted-foreground">No dashboard data to display yet.</Card>}
    </>}
  </div>;
}