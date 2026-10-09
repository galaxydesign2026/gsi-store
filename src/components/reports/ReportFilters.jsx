import { Filter, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function ReportFilters({ filters, setFilters, onApply, loading }) {
  const invalidRange = filters.from && filters.to && filters.from > filters.to;
  const change = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  return <Card className="p-5 space-y-4">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" />Report Filters</h2>
    <form onSubmit={event => { event.preventDefault(); if (!invalidRange) onApply(); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="report-from">From date</Label><Input id="report-from" type="date" value={filters.from} max={filters.to || undefined} onChange={e => change('from', e.target.value)} disabled={loading} /></div>
        <div className="space-y-2"><Label htmlFor="report-to">To date</Label><Input id="report-to" type="date" value={filters.to} min={filters.from || undefined} onChange={e => change('to', e.target.value)} disabled={loading} /></div>
        <div className="space-y-2"><Label htmlFor="report-team">Team</Label><Select value={filters.teamcode || 'all'} onValueChange={value => change('teamcode', value === 'all' ? '' : value)} disabled={loading}><SelectTrigger id="report-team"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{['GSIA', 'GSIB', 'GSID'].map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {invalidRange && <p role="alert" className="text-sm text-destructive">From date must be on or before To date.</p>}
      <Button type="submit" variant="primary" disabled={loading || Boolean(invalidRange)}>{loading && <Loader2 className="animate-spin" />}Apply</Button>
    </form>
  </Card>;
}