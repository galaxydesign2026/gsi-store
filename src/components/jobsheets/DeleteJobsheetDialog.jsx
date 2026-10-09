import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom delete confirmation modal with loading state.
export default function DeleteJobsheetDialog({ open, jobsheetNo, deleting, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-foreground">Delete Job Sheet</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Delete job sheet <span className="font-semibold text-foreground">{jobsheetNo}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting} className="gap-2">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}