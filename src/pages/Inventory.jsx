import { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, Search, Package, Edit2, Trash2, Loader2, X, RefreshCw,
  Boxes, CheckCircle2, AlertTriangle, XCircle, Eye,
  Paintbrush, Hammer, HardHat, Wrench, Layers, Construction, ShoppingBasket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemFormModal from "@/components/ItemFormModal";
import { toast } from "sonner";
import { getGsiUser } from "@/lib/gsiUser";

const PAGE_SIZE = 50;

// ─── Category look (icon + colour). Unknown categories fall back to "default". ─
const CATEGORY_STYLE = {
  "Carpentry & Hardware": { icon: Hammer, tint: "bg-orange-50 text-orange-600 ring-orange-100", chip: "bg-orange-50 text-orange-700" },
  "Consumables": { icon: ShoppingBasket, tint: "bg-sky-50 text-sky-600 ring-sky-100", chip: "bg-sky-50 text-sky-700" },
  "Safety": { icon: HardHat, tint: "bg-yellow-50 text-yellow-600 ring-yellow-100", chip: "bg-yellow-50 text-yellow-800" },
  "Tools & Equipment": { icon: Wrench, tint: "bg-violet-50 text-violet-600 ring-violet-100", chip: "bg-violet-50 text-violet-700" },
  "Paint & Coatings": { icon: Paintbrush, tint: "bg-pink-50 text-pink-600 ring-pink-100", chip: "bg-pink-50 text-pink-700" },
  "Scaffolding": { icon: Construction, tint: "bg-emerald-50 text-emerald-600 ring-emerald-100", chip: "bg-emerald-50 text-emerald-700" },
  "Ladders": { icon: Layers, tint: "bg-teal-50 text-teal-600 ring-teal-100", chip: "bg-teal-50 text-teal-700" },
  default: { icon: Package, tint: "bg-slate-50 text-slate-500 ring-slate-100", chip: "bg-slate-100 text-slate-700" },
};
const catStyle = (c) => CATEGORY_STYLE[c] || CATEGORY_STYLE.default;

// ─── Stock status (display only) ─────────────────────────────────────────────
// Out of Stock: available <= 0 · Low Stock: available <= minimum · otherwise In Stock
const stockStatus = (item) => {
  if (item.status && item.status.toLowerCase() === "inactive") return "inactive";
  const avail = Number(item.availableqty) || 0;
  const min = Number(item.minimumqty) || 0;
  if (avail <= 0) return "out";
  if (avail <= min) return "low";
  return "in";
};

const STATUS_META = {
  in: { label: "In Stock", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  low: { label: "Low Stock", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "bg-amber-500" },
  out: { label: "Out of Stock", cls: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", bar: "bg-rose-400" },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400", bar: "bg-slate-300" },
};

// Pull structured bits out of the imported description text:
// "Unit price S$0.50 | Consumable | Ref: Store Materials #76"
const parseDescription = (desc = "") => {
  const price = desc.match(/Unit price\s*S\$\s*([\d.,]+)/i)?.[1] || null;
  const type = /returnable/i.test(desc) ? "Returnable" : /consumable/i.test(desc) ? "Consumable" : null;
  return { price, type };
};

function StatusPill({ status }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// Item photo when available (photo_url / photourl), otherwise a category icon tile.
function ItemThumb({ item, size = "md" }) {
  const [broken, setBroken] = useState(false);
  const url = item.photo_url || item.photourl || null;
  const s = catStyle(item.category);
  const Icon = s.icon;
  const dim = size === "lg" ? "h-14 w-14 rounded-xl" : "h-11 w-11 rounded-lg";
  if (url && !broken) {
    return <img src={url} alt={item.itemname} loading="lazy" onError={() => setBroken(true)} className={`${dim} flex-shrink-0 object-cover ring-1 ring-border bg-muted`} />;
  }
  return (
    <div className={`${dim} flex flex-shrink-0 items-center justify-center ring-1 ${s.tint}`}>
      <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={1.8} />
    </div>
  );
}

function StockMeter({ item, status }) {
  const total = Number(item.totalqty) || 0;
  const avail = Number(item.availableqty) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((avail / total) * 100)) : 0;
  return (
    <div className="min-w-[110px]">
      <div className="flex items-baseline gap-1">
        <span className="font-semibold tabular-nums text-foreground">{avail}</span>
        <span className="text-xs text-muted-foreground tabular-nums">/ {total}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${STATUS_META[status].bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-primary ring-2 ring-primary/15" : "border-border"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none tabular-nums text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="hidden h-6 w-24 animate-pulse rounded-full bg-muted md:block" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadedRef = useRef(false);

  const gsiUser = getGsiUser();
  const role = gsiUser?.role?.toLowerCase();
  const isAdmin = role === "admin";
  // Director & Project Manager: view-only access (no add / edit / delete)
  const isViewOnly = ["director", "team_manager"].includes(role);
  const canEdit = isAdmin && !isViewOnly;

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await base44.functions.invoke("getAllInventory", {});
      setItems(res.data?.items || []);
    } catch (err) {
      console.error("getAllInventory failed:", err);
      toast.error("Failed to load inventory");
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Reset paging whenever the filters change
  useEffect(() => { setVisible(PAGE_SIZE); }, [search, category, statusFilter]);

  // Enrich once per load: status + parsed description
  const enriched = useMemo(
    () => items.map((it) => ({ ...it, _status: stockStatus(it), ...parseDescription(it.description || "") })),
    [items]
  );

  // Categories come from the real data (with counts) — never a hard-coded list
  const categories = useMemo(() => {
    const counts = {};
    enriched.forEach((it) => { const c = it.category || "Uncategorised"; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [enriched]);

  const stats = useMemo(() => {
    const s = { all: enriched.length, in: 0, low: 0, out: 0 };
    enriched.forEach((it) => { if (s[it._status] !== undefined) s[it._status] += 1; });
    return s;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched
      .filter((it) => {
        const matchSearch = !q ||
          it.itemname?.toLowerCase().includes(q) ||
          it.itemcode?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q);
        const matchCat = category === "All" || (it.category || "Uncategorised") === category;
        const matchStatus = statusFilter === "all" || it._status === statusFilter;
        return matchSearch && matchCat && matchStatus;
      })
      .sort((a, b) => (a.itemcode || "").localeCompare(b.itemcode || ""));
  }, [enriched, search, category, statusFilter]);

  const shown = filtered.slice(0, visible);
  const hasFilters = search || category !== "All" || statusFilter !== "all";
  const clearFilters = () => { setSearch(""); setCategory("All"); setStatusFilter("all"); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await base44.functions.invoke("deleteInventoryItem", { id: deleteTarget.id });
      const data = res.data || {};
      if (data.success) {
        toast.success("Item deleted successfully.");
        setDeleteTarget(null);
        await load(true);
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Unexpected error occurred");
    }
    setDeleting(false);
  };

  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "in", label: "In Stock" },
    { key: "low", label: "Low" },
    { key: "out", label: "Out" },
  ];

  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-6">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory</h1>
            {isViewOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200">
                <Eye className="h-3 w-3" /> View only
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Store items, stock levels and categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading || refreshing} className="h-9 gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canEdit && (
            <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="h-9 gap-2">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary cards (click to filter) ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Boxes} label="Total items" value={loading ? "–" : stats.all} tone="bg-blue-50 text-blue-600" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        <StatCard icon={CheckCircle2} label="In stock" value={loading ? "–" : stats.in} tone="bg-emerald-50 text-emerald-600" active={statusFilter === "in"} onClick={() => setStatusFilter("in")} />
        <StatCard icon={AlertTriangle} label="Low stock" value={loading ? "–" : stats.low} tone="bg-amber-50 text-amber-600" active={statusFilter === "low"} onClick={() => setStatusFilter("low")} />
        <StatCard icon={XCircle} label="Out of stock" value={loading ? "–" : stats.out} tone="bg-rose-50 text-rose-600" active={statusFilter === "out"} onClick={() => setStatusFilter("out")} />
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 rounded-2xl border border-border bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              placeholder="Search item name, code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Status segmented control */}
          <div className="inline-flex rounded-xl bg-muted p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition md:flex-none ${
                  statusFilter === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips (from real data) */}
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
          <button
            onClick={() => setCategory("All")}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
              category === "All" ? "bg-[hsl(217,91%,22%)] text-white ring-transparent" : "bg-white text-muted-foreground ring-border hover:text-foreground"
            }`}
          >
            All categories <span className="ml-1 opacity-70">{enriched.length}</span>
          </button>
          {categories.map(([c, n]) => {
            const Icon = catStyle(c).icon;
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? "All" : c)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                  active ? "bg-[hsl(217,91%,22%)] text-white ring-transparent" : "bg-white text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result line */}
      {!loading && (
        <div className="mb-3 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            Showing <span className="font-semibold text-foreground">{shown.length}</span> of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> items
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="font-medium text-primary hover:underline">Clear filters</button>
          )}
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white py-16 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-foreground">No items match your filters</p>
          {hasFilters && <button onClick={clearFilters} className="mt-2 text-sm font-medium text-primary hover:underline">Clear filters</button>}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground [&>th]:whitespace-nowrap">
                  <th className="w-full px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-blue-50/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <ItemThumb item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground" title={item.itemname}>{item.itemname || "—"}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{item.itemcode || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${catStyle(item.category).chip}`}>{item.category || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {item.type ? (
                        <span className={`rounded-md px-2 py-0.5 font-medium ${item.type === "Returnable" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{item.type}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {item.price ? <span className="font-medium text-foreground">S${item.price}</span> : <span className="text-muted-foreground/60">—</span>}
                    </td>
                    <td className="px-4 py-2.5"><StockMeter item={item} status={item._status} /></td>
                    <td className="px-4 py-2.5"><StatusPill status={item._status} /></td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <button onClick={() => { setEditItem(item); setShowForm(true); }} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent" aria-label="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {shown.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                <div className="flex gap-3">
                  <ItemThumb item={item} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.itemname || "—"}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{item.itemcode || "—"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${catStyle(item.category).chip}`}>{item.category || "—"}</span>
                      {item.type && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{item.type}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-semibold tabular-nums text-foreground">{item.availableqty ?? 0} <span className="font-normal text-muted-foreground">/ {item.totalqty ?? 0}</span></p>
                    </div>
                    {item.price && (
                      <div>
                        <p className="text-muted-foreground">Unit price</p>
                        <p className="font-semibold tabular-nums text-foreground">S${item.price}</p>
                      </div>
                    )}
                  </div>
                  <StatusPill status={item._status} />
                </div>
                {canEdit && (
                  <div className="mt-2.5 flex gap-4 border-t border-border pt-2.5">
                    <button onClick={() => { setEditItem(item); setShowForm(true); }} className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {visible < filtered.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="h-10 rounded-xl px-6">
                Load more ({filtered.length - visible} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <ItemFormModal
          item={editItem}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(true); }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={deleting ? undefined : () => setDeleteTarget(null)} />
          <div className="relative mx-4 w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="mb-1 text-lg font-bold">Delete Item?</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.itemname}</span>? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="h-11 flex-1">Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="h-11 flex-1">
                  {deleting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>) : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
