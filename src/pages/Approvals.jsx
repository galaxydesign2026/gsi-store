import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobSheetApprovalPanel from '@/components/approvals/JobSheetApprovalPanel';
import ItemRequestApprovals from '@/components/requests/ItemRequestApprovals';
import { getGsiUser } from '@/lib/gsiUser';
import { normalizeRole } from '@/lib/roles';

export default function Approvals() {
  const [params] = useSearchParams();
  const [section, setSection] = useState(params.get('section') === 'requests' ? 'requests' : 'jobsheets');
  const role = normalizeRole(getGsiUser()?.role);
  return <>
    <div className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-8"><Tabs value={section} onValueChange={setSection}><TabsList><TabsTrigger value="jobsheets">Job Sheets</TabsTrigger><TabsTrigger value="requests">Item Requests</TabsTrigger></TabsList></Tabs></div>
    {section === 'jobsheets' ? <JobSheetApprovalPanel initialTab={params.get('view') === 'history' ? 'history' : 'pending'} /> : <ItemRequestApprovals role={role} initialFilter={params.get('filter')} />}
  </>;
}