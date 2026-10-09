import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StoreFilters({ search, setSearch, category, setCategory, categories }) {
  return <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm font-semibold">Store Items</p>
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9 sm:w-72" placeholder="Search item code or name..." aria-label="Search item code or name" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-9 sm:w-48" aria-label="Category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">All categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
    </div>
  </div>;
}