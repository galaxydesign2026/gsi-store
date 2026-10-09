import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">This screen will be built next.</p>
    </div>
  );
}