// Maps a dashboard KPI (by role + key name) to the page/tab that lists those records.
// Keys come from the get_*_dashboard RPCs, so we match on words inside the key.
const has = (k, ...words) => words.some(w => k.includes(w));

export function kpiLink(role, key) {
  const k = String(key || '').toLowerCase();
  switch (role) {
    case 'director':
    case 'project_executive':
    case 'team_manager': {
      if (has(k, 'request')) {
        if (role === 'director') {
          if (has(k, 'issued')) return '/approvals?section=requests&filter=issued';
          if (has(k, 'ready', 'approved')) return '/approvals?section=requests&filter=issue';
          if (has(k, 'reject', 'cancel')) return '/approvals?section=requests&filter=closed';
          return '/approvals?section=requests&filter=approval';
        }
        return '/approvals?section=requests';
      }
      if (has(k, 'by_me', 'approved', 'rejected', 'history', 'actioned')) return '/approvals?section=jobsheets&view=history';
      return '/approvals?section=jobsheets';
    }
    case 'store_admin':
      if (has(k, 'stock', 'inventory', 'item')) return '/inventory';
      if (has(k, 'issue', 'ready', 'approved')) return '/requests?tab=issue';
      if (has(k, 'complete', 'issued', 'reject', 'cancel')) return '/requests?tab=completed';
      if (has(k, 'progress', 'approval')) return '/requests?tab=approval';
      return '/requests?tab=review';
    case 'supervisor':
      if (has(k, 'stock', 'available', 'catalog') || k === 'items') return '/items';
      return '/my-requests';
    case 'team_admin':
      return '/job-sheets';
    default:
      return undefined;
  }
}
