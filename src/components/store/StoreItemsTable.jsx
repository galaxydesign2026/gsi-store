import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableCard, EmptyState } from '@/components/ui/data-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';

export default function StoreItemsTable({ items, cart, onAdd }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  if (!items.length) return <EmptyState icon={Package} title="No items found" description="Try another item code, name, or category." />;
  return <>
    <DataTableCard className="rounded-none border-0 shadow-none"><Table>
      <TableHeader><TableRow className="border-b-0 hover:bg-transparent">{['Item Code', 'Item Name', 'Category', 'Brand / Model', 'Available qty', 'Action'].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{items.slice((current - 1) * pageSize, current * pageSize).map(item => {
        const available = Number(item.availableqty) || 0;
        const selected = cart.some(l => l.id === item.id);
        return <TableRow key={item.id} className={available <= 0 ? 'bg-muted/50 text-muted-foreground opacity-60' : ''}>
          <TableCell className="font-mono text-xs">{item.itemcode}</TableCell><TableCell className="font-medium">{item.itemname}</TableCell>
          <TableCell className="text-muted-foreground">{item.category || '—'}</TableCell><TableCell>{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</TableCell>
          <TableCell><span className="mr-2 font-medium">{available}</span>{available <= 0 && <StatusBadge tone="slate">Out of stock</StatusBadge>}</TableCell>
          <TableCell><Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={available <= 0 || selected} onClick={() => onAdd(item)}><Plus className="h-3.5 w-3.5" />{selected ? 'Added' : 'Add'}</Button></TableCell>
        </TableRow>;
      })}</TableBody>
    </Table></DataTableCard>
    <TablePagination page={current} pageCount={pageCount} pageSize={pageSize} total={items.length} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
  </>;
}