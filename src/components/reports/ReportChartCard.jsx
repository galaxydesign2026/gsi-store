import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

const colors = ['hsl(var(--primary))', 'hsl(var(--primary) / .65)', 'hsl(var(--navy))', 'hsl(var(--destructive))', 'hsl(var(--primary) / .4)', 'hsl(var(--muted-foreground))'];
export default function ReportChartCard({ title, data, donut = false, series = [{ key: 'count', label: 'Count' }] }) {
  const hasData = data.some(row => series.some(s => Number(row[s.key]) > 0));
  return <Card className="min-w-0 p-5 space-y-4">
    <h2 className="font-semibold">{title}</h2>
    {!hasData ? <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">No data to show for these filters.</p> : <ResponsiveContainer width="100%" height={280}>
      {donut ? <PieChart><Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{data.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart> : <BarChart data={data} margin={{ top: 8, right: 5, bottom: 18, left: -15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, index) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />)}
      </BarChart>}
    </ResponsiveContainer>}
  </Card>;
}