import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ApprovalConfirmation({ action, sheetNo, saving, onCancel, onConfirm }) {
  const reject = action === 'reject';
  return <AlertDialog open={!!action} onOpenChange={open => { if (!open && !saving) onCancel(); }}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{reject ? 'Reject' : 'Approve'} job sheet?</AlertDialogTitle>
        <AlertDialogDescription>Confirm that you want to {action} {sheetNo || 'this job sheet'}. This will update its approval stage.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="tertiary" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button variant={reject ? 'destructive' : 'primary'} disabled={saving} onClick={onConfirm}>{saving && <Loader2 className="animate-spin" />}{saving ? 'Saving...' : reject ? 'Confirm Reject' : 'Confirm Approve'}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}