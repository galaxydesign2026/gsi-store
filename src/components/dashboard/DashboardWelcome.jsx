export default function DashboardWelcome({ profile, role }) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(217,91%,22%)] to-[hsl(215,60%,38%)] p-5 shadow-lg text-white">
    <div className="relative z-10">
      <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <h1 className="text-xl font-bold leading-tight">{greeting}, {profile?.username || 'there'} 👋</h1>
      <p className="text-white/65 text-sm mt-0.5 capitalize">{role}{profile?.team ? ` · ${profile.team}` : ''}</p>
    </div>
    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" /><div className="absolute -bottom-8 right-10 w-20 h-20 rounded-full bg-white/5" />
  </div>;
}