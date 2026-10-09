import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Tools", "Materials", "Fixtures", "Electrical", "Plumbing", "Safety", "Furniture", "Other"];

export default function ItemFormModal({ item, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    itemcode: item?.itemcode || "",
    itemname: item?.itemname || "",
    category: item?.category || "",
    brand: item?.brand || "",
    model: item?.model || "",
    description: item?.description || "",
    totalqty: item?.totalqty ?? "",
    availableqty: item?.availableqty ?? "",
    minimumqty: item?.minimumqty ?? "",
    photo_url: item?.photo_url || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateFields, setDuplicateFields] = useState([]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
    } catch {
      toast({ title: "Photo upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const validate = () => {
    if (!form.itemname?.trim()) return "Item name is required";
    if (!form.category) return "Category is required";
    if (form.totalqty === "" || form.totalqty === null) return "Total quantity is required";
    if (form.availableqty === "" || form.availableqty === null) return "Available quantity is required";
    if (Number(form.totalqty) < 0) return "Total quantity cannot be negative";
    if (Number(form.availableqty) < 0) return "Available quantity cannot be negative";
    if (Number(form.availableqty) > Number(form.totalqty)) return "Available quantity cannot exceed total quantity";
    if (form.minimumqty && Number(form.minimumqty) >= Number(form.totalqty)) return "Minimum quantity must be less than total quantity";
    return null;
  };

  const handleSave = async () => {
    // Clear any previous error/success notifications
    toast.dismiss();
    setDuplicateFields([]);

    const validationError = validate();
    if (validationError) {
      toast.error(validationError, { duration: 5000 });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        itemname: form.itemname.trim(),
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description.trim(),
        totalqty: Number(form.totalqty),
        availableqty: Number(form.availableqty),
        minimumqty: form.minimumqty ? Number(form.minimumqty) : 0,
        status: "Active",
      };

      // Edit mode: include id so the backend performs an UPDATE, not an INSERT
      if (isEdit) {
        payload.id = item.id;
      } else {
        payload.itemcode = form.itemcode.trim();
      }

      const res = await base44.functions.invoke("saveInventoryItem", payload);
      const data = res.data || {};

      if (data.success) {
        toast.success(data.message || "Inventory item saved successfully.", { duration: 5000 });
        onSaved();
      } else {
        if (data.duplicate) {
          setDuplicateFields(["itemname", "category", "description"]);
        }
        toast.error(data.error || (isEdit ? "Failed to update item" : "Failed to add item"), { duration: 5000 });
        setSaving(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Unexpected error occurred";
      toast.error(msg, { duration: 5000 });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">{isEdit ? "Edit Item" : "Add Item"}</h2>
            <button onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Photo Upload */}
            <div>
              <Label className="text-sm font-medium">Photo</Label>
              <div className="mt-1 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-accent overflow-hidden flex-shrink-0">
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="Item" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-7 h-7 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <label className="flex-1">
                  <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload Photo</>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              </div>
            </div>

            {/* Item Code — read-only in edit mode, auto-generated on add */}
            <div>
              <Label className="text-sm font-medium">Item Code</Label>
              <Input
                className="mt-1 h-11"
                placeholder="Auto-generated if left blank (e.g. GSI0001)"
                value={form.itemcode}
                onChange={e => setForm(f => ({ ...f, itemcode: e.target.value }))}
                disabled={isEdit}
                readOnly={isEdit}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Item Name *</Label>
              <Input className={`mt-1 h-11 ${duplicateFields.includes("itemname") ? "border-red-500 ring-1 ring-red-500" : ""}`} placeholder="Enter item name" value={form.itemname} onChange={e => { setForm(f => ({ ...f, itemname: e.target.value })); setDuplicateFields([]); }} />
            </div>

            <div>
              <Label className="text-sm font-medium">Category *</Label>
              <Select value={form.category} onValueChange={v => { setForm(f => ({ ...f, category: v })); setDuplicateFields([]); }}>
                <SelectTrigger className={`mt-1 h-11 ${duplicateFields.includes("category") ? "border-red-500 ring-1 ring-red-500" : ""}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea className={`mt-1 resize-none ${duplicateFields.includes("description") ? "border-red-500 ring-1 ring-red-500" : ""}`} rows={2} placeholder="Item description" value={form.description} onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setDuplicateFields([]); }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Total Qty *</Label>
                <Input className="mt-1 h-11" type="number" min="0" placeholder="0" value={form.totalqty} onChange={e => setForm(f => ({ ...f, totalqty: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Available Qty *</Label>
                <Input className="mt-1 h-11" type="number" min="0" placeholder="0" value={form.availableqty} onChange={e => setForm(f => ({ ...f, availableqty: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Minimum Qty</Label>
              <Input className="mt-1 h-11" type="number" min="0" placeholder="0" value={form.minimumqty} onChange={e => setForm(f => ({ ...f, minimumqty: e.target.value }))} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-semibold mt-2">
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (isEdit ? "Save Changes" : "Add Item")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}