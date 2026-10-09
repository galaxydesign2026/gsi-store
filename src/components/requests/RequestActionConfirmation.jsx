import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const names = { approve: 'Approve', reject: 'Reject', issue: 'Issue', cancel: 'Cancel' };
export default function RequestActionConfirmation({ action, requestno, saving, onCancel, onConfirm }) {
  return <AlertDialog open={!!action} onOpenChange={open => { if (!open && !saving) onCancel(); }}>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{names[action]} request?</AlertDialogTitle><AlertDialogDescription>Confirm that you want to {action} {requestno}. {action === 'issue' ? 'The entered quantities will be issued.' : 'This will update the request workflow.'}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><Button variant="tertiary" disabled={saving} onClick={onCancel}>Back</Button><Button variant={['reject', 'cancel'].includes(action) ? 'destructive' : 'primary'} disabled={saving} onClick={onConfirm}>{saving && <Loader2 className="animate-spin" />}{saving ? 'Saving...' : `Confirm ${names[action]}`}</Button></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}