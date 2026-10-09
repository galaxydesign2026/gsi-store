import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';
import { titleCase } from '@/components/dashboard/dashboardFormat';

export default function DashboardBarCard({ name, values }) {
  const rows = Object.entries(values).map(([key, value]) => ({ label: titleCase(key), value }));
  return <ChartCard title={titleCase(name)}>
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 36)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={value => [Number(value).toLocaleString('en-SG'), 'Value']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>;
}