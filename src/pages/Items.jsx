import { useState } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import PageLoader from '@/components/PageLoader';
import RequestModal from '@/components/RequestModal';
import StoreFilters from '@/components/store/StoreFilters';
import StoreItemsTable from '@/components/store/StoreItemsTable';
import StoreLoadError from '@/components/store/StoreLoadError';
import useStoreData from '@/components/store/useStoreData';

export default function Items() {
  const { data, loading, error, load } = useStoreData('listStoreItems');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('__all__');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const items = data?.items || [];
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const filtered = items.filter(i => (category === '__all__' || i.category === category) && [i.itemcode, i.itemname].some(v => String(v || '').toLowerCase().includes(query)));
  const add = item => { if (Number(item.availableqty) > 0) setCart(prev => prev.some(l => l.id === item.id) ? prev : [...prev, { ...item, qty: 1 }]); };
  const submitted = () => { setCartOpen(false); setCart([]); load(); };
  if (loading) return <PageLoader />;
  return <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
    <PageHeader title="Store Items" subtitle="Request available stock for your approved job sheets." icon={Package} actions={<Button variant="gradient" className="h-10 gap-2 px-4" onClick={() => setCartOpen(true)}><ShoppingCart className="h-4 w-4" />Request cart<span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs" aria-label={`${cart.length} items in cart`}>{cart.length}</span></Button>} />
    {error ? <StoreLoadError error={error} retry={load} /> : <Card className="mt-6 overflow-hidden p-0">
      <StoreFilters search={search} setSearch={setSearch} category={category} setCategory={setCategory} categories={categories} />
      <StoreItemsTable key={`${search}:${category}`} items={filtered} cart={cart} onAdd={add} />
    </Card>}
    {cartOpen && <RequestModal cart={cart} onChangeCart={setCart} onClose={() => setCartOpen(false)} onSubmitted={submitted} />}
  </div>;
}