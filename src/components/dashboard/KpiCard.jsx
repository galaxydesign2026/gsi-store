import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function KpiCard({ icon: Icon, label, value, gradient, to }) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl p-4 shadow-sm border border-white/60 active:scale-95 transition-transform duration-150 ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-inner"><Icon className="w-5 h-5 text-white" /></div>
        {to && <ArrowRight className="w-4 h-4 text-white/60 mt-1" />}
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1 break-words">{value}</p>
      <p className="text-xs text-white/75 font-medium">{label}</p>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  );
  return to ? <Link to={to} aria-label={`${label}: open list`} className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">{inner}</Link> : inner;
}