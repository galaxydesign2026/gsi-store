import { StatusBadge } from '@/components/ui/status-badge';
import { getStatusMeta } from '@/components/approvals/approvalDisplay';
import { ExternalLink } from 'lucide-react';

export default function ApprovalDetails({ sheet }) {
  const meta = getStatusMeta(sheet.status);
  const fields = [['Job Sheet No', sheet.jobsheetno], ['Project', sheet.projectname], ['Prefix', sheet.projectprefix], ['Team', sheet.teamcode], ['Assigned PE', sheet.assignedpe_name], ['Assigned Manager', sheet.assignedmanager_name], ['Assigned Director', sheet.assigneddirector == null ? 'Any director' : sheet.assigneddirector_name]];
  return <section className="space-y-4">
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value || '—'}</dd></div>)}
      <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</dt><dd className="mt-1"><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></dd></div>
    </dl>
    {sheet.quotationfilepath && (sheet.quotationurl ? <a href={sheet.quotationurl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all text-sm font-medium text-primary underline"><ExternalLink className="h-4 w-4 shrink-0" />{sheet.quotationfilename || 'View quotation'}</a> : <p className="text-sm text-destructive">Quotation could not be opened. Close and reopen this review to retry.</p>)}
  </section>;
}