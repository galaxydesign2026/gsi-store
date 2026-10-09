import { Trash2, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/data-table';

export default function CartLines({ cart, onChange, disabled }) {
  if (!cart.length) return <EmptyState icon={ShoppingCart} title="Your request cart is empty." description="Add items from Store Items to start a request." />;
  return <div className="divide-y divide-border rounded-xl border border-border">
    {cart.map(line => <div key={line.id} className="flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{line.itemname}</p><p className="text-xs text-muted-foreground">{line.itemcode} · Available: {line.availableqty}</p></div>
      <div className="w-24"><label htmlFor={`qty-${line.id}`} className="text-xs text-muted-foreground">Quantity</label><Input id={`qty-${line.id}`} type="number" min={1} max={Number(line.availableqty)} step={1} required disabled={disabled} value={line.qty} onChange={e => onChange(cart.map(l => l.id === line.id ? { ...l, qty: e.target.value } : l))} /></div>
      <Button type="button" variant="destructive" size="icon" disabled={disabled} aria-label={`Remove ${line.itemname}`} onClick={() => onChange(cart.filter(l => l.id !== line.id))}><Trash2 /></Button>
    </div>)}
  </div>;
}