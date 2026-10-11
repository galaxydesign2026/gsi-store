import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ItemFormModal from "@/components/ItemFormModal";
import { toast } from "sonner";
import { getGsiUser } from "@/lib/gsiUser";

const CATEGORIES = ["All", "Tools", "Materials", "Fixtures", "Electrical", "Plumbing", "Safety", "Furniture", "Other"];

// ─── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({ status, availableqty, minimumqty }) {
  const isLowStock = Number(availableqty) <= Number(minimumqty);
  if (isLowStock) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> Low Stock
      </span>
    );
  }
  if (status && status.toLowerCase() === "inactive") {
    return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">Inactive</span>;
  }
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">Available</span>;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="space-y-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-2" />
          <div className="flex gap-3 mt-3">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadedRef = useRef(false);

  // Read user from localStorage synchronously — page renders instantly
  const gsiUser = getGsiUser();
  const isAdmin = gsiUser?.role?.toLowerCase() === "admin";
  // Director & Project Manager: view-only access (no add / edit / delete)
  const isViewOnly = ["director", "team_manager"].includes(gsiUser?.role?.toLowerCase());

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getAllInventory", {});
      setItems(res.data?.items || []);
    } catch (err) {
      console.error("getAllInventory failed:", err);
      toast({ title: "Failed to load inventory", variant: "destructive" });
    }
    setLoading(false);
  };

  // ── Client-side filtering (future: server-side via query params) ──────────
  const filtered = items.filter(item => {
    const matchSearch =
      !search ||
      item.itemname?.toLowerCase().includes(search.toLowerCase()) ||
      item.itemcode?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || item.category === category;
    const isLow = Number(item.availableqty) <= Number(item.minimumqty);
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Available" && !isLow) ||
      (statusFilter === "Low Stock" && isLow);
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => (a.itemcode || "").localeCompare(b.itemcode || ""));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await base44.functions.invoke("deleteInventoryItem", { id: deleteTarget.id });
      const data = res.data || {};
      if (data.success) {
        toast.success("Item deleted successfully.");
        setDeleteTarget(null);
        await load();
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Unexpected error occurred";
      toast.error(msg);
    }
    setDeleting(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Inventory
            {isViewOnly && (
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">View only</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isAdmin && !isViewOnly && (
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="h-10 px-4 gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11"
            placeholder="Search by item code or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items — Desktop Table */}
      {loading ? (
        <>
          <div className="hidden md:block"><TableSkeleton /></div>
          <div className="md:hidden"><MobileSkeleton /></div>
        </>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No items found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Item Code", "Item Name", "Category", "Description", "Total Qty", "Available Qty", "Min Qty", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                    {isAdmin && !isViewOnly && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(item => {
                    const isLow = Number(item.availableqty) <= Number(item.minimumqty);
                    return (
                      <tr key={item.id} className={`hover:bg-muted/20 transition-colors ${isLow ? "bg-amber-50/60" : ""}`}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.itemcode || "—"}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{item.itemname || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.category || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground" title={item.description || ""}>
                          {item.description
                            ? (item.description.length > 45 ? item.description.slice(0, 45) + "…" : item.description)
                            : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.totalqty ?? "—"}</td>
                        <td className={`px-4 py-3 font-semibold ${isLow ? "text-amber-700" : ""}`}>{item.availableqty ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.minimumqty ?? "—"}</td>
                        <td className="px-4 py-3"><StatusPill status={item.status} availableqty={item.availableqty} minimumqty={item.minimumqty} /></td>
                        {isAdmin && !isViewOnly && (
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => { setEditItem(item); setShowForm(true); }}
                              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(item => {
              const isLow = Number(item.availableqty) <= Number(item.minimumqty);
              return (
                <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${isLow ? "border-amber-300" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.itemname || "—"}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.itemcode || "—"}</p>
                    </div>
                    <StatusPill status={item.status} availableqty={item.availableqty} minimumqty={item.minimumqty} />
                  </div>
                  {item.category && (
                    <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground mb-3">{item.category}</span>
                  )}
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-foreground">{item.totalqty ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className={`font-semibold ${isLow ? "text-amber-700" : "text-foreground"}`}>{item.availableqty ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minimum</p>
                      <p className="font-semibold text-foreground">{item.minimumqty ?? "—"}</p>
                    </div>
                  </div>
                  {isAdmin && !isViewOnly && (
                    <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="flex items-center gap-1 text-xs text-primary font-medium"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="flex items-center gap-1 text-xs text-destructive font-medium ml-3"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <ItemFormModal
          item={editItem}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={deleting ? undefined : () => setDeleteTarget(null)} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 mx-4">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold mb-1">Delete Item?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.itemname}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}