export const REQUEST_STATUS_META = {
  pending_store: { label: 'Pending Store', tone: 'warning' },
  pending_pe: { label: 'Pending PE', tone: 'warning' },
  pending_manager: { label: 'Pending Manager', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  partially_issued: { label: 'Partially Issued', tone: 'navy' },
  issued: { label: 'Issued', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
  pending: { label: 'Pending', tone: 'warning' },
};
export const requestMeta = value => REQUEST_STATUS_META[value] || { label: value || '—', tone: 'neutral' };
export const storeErrorMessage = e => e?.response?.data?.error || e?.message || 'Unable to complete this request.';
export function requestDate(value) {
  return value ? new Date(value).toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}