import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StoreLoadError({ error, retry }) {
  return <Card className="mt-6 space-y-3 p-6"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="secondary" onClick={retry}>Retry</Button></Card>;
}