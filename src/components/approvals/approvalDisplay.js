export const STATUS_META = {
  draft: { tone: 'slate', label: 'Draft' },
  pending_pe: { tone: 'warning', label: 'Pending PE' },
  pending_manager: { tone: 'warning', label: 'Pending Manager' },
  pending_director: { tone: 'navy', label: 'Pending Director' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
};
export const getStatusMeta = s => STATUS_META[(s || '').toLowerCase()] || { tone: 'neutral', label: s || '—' };
export const stageLabels = { project_executive: 'Project Executive review', team_manager: 'Team Manager review', director: 'Director review' };
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const pickDate = s => s.submitteddt || s.updateddt || s.updated_date || s.updated_at || s.createddt || s.created_date || s.created_at;
export const errorMessage = e => e?.response?.data?.error || e?.message || 'Unable to complete this request.';