import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Eye,
  List,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import PageLoader from "@/components/PageLoader";
import PageHeader from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableCard, EmptyState } from "@/components/ui/data-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatSGD } from "@/lib/jobsheetPdf";
import { getGsiUser } from "@/lib/gsiUser";

// Status → badge tone + display label.
const STATUS_META = {
  draft: { tone: "slate", label: "Draft" },
  pending_pe: { tone: "warning", label: "Pending PE" },
  pending_manager: { tone: "warning", label: "Pending Manager" },
  pending_director: { tone: "navy", label: "Pending Director" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "danger", label: "Rejected" },
};
const getStatusMeta = (s) =>
  STATUS_META[(s || "").toLowerCase()] || { tone: "neutral", label: s || "—" };

const isPending = (s) =>
  ["pending_pe", "pending_manager", "pending_director"].includes(
    (s || "").toLowerCase()
  );

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Pick the best available timestamp from the row (column name varies).
const pickDate = (s) =>
  s.updated_date || s.updated_at || s.created_date || s.created_at || null;

export default function JobSheets() {
  const navigate = useNavigate();
  const gsiUser = getGsiUser();

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("listJobSheets", {});
      if (res?.data?.error) throw new Error(res.data.error);
      setSheets(res?.data?.jobsheets || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load job sheets");
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = sheets.length;
    const pending = sheets.filter((s) => isPending(s.status)).length;
    const approved = sheets.filter(
      (s) => (s.status || "").toLowerCase() === "approved"
    ).length;
    const rejected = sheets.filter(
      (s) => (s.status || "").toLowerCase() === "rejected"
    ).length;
    return { total, pending, approved, rejected };
  }, [sheets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter((s) =>
      [s.jobsheetno, s.projectname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [sheets, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  const goEdit = (id) => navigate(`/jobsheets/edit/${id}`);
  const goView = (id) => navigate(`/jobsheets/edit/${id}`);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
      {/* Header */}
      <PageHeader
        title="Job Sheets"
        subtitle="Create, track and manage your team's job sheets."
        icon={FileText}
        actions={
          <Button
            variant="gradient"
            onClick={() => navigate("/jobsheets/new")}
            className="h-10 gap-2 px-4"
          >
            <Plus className="h-4 w-4" /> New Job Sheet
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={List}
          label="Total"
          value={stats.total}
          sublabel="All job sheets"
          tone="indigo"
        />
        <StatCard
          icon={Hourglass}
          label="Pending Approval"
          value={stats.pending}
          sublabel="Awaiting review"
          tone="orange"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={stats.approved}
          sublabel="Ready to use"
          tone="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={stats.rejected}
          sublabel="Needs attention"
          tone="pink"
        />
      </div>

      {/* List card */}
      <Card className="mt-6 overflow-hidden p-0">
        {/* Card header */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Job Sheets</p>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {sheets.length} sheets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search job sheet no. or project name..."
                className="h-9 w-full pl-9 sm:w-80"
              />
            </div>
          </div>
        </div>

        {/* Table / empty state */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No Job Sheets Yet"
            description="Create your first job sheet to get started."
          >
            <Button
              variant="gradient"
              onClick={() => navigate("/jobsheets/new")}
              className="mt-4 h-10 gap-2 px-4"
            >
              <Plus className="h-4 w-4" /> New Job Sheet
            </Button>
          </EmptyState>
        ) : (
          <DataTableCard className="rounded-none border-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead>Job Sheet No</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Assigned PE</TableHead>
                  <TableHead>Assigned Manager</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((s) => {
                  const meta = getStatusMeta(s.status);
                  const canEdit = ["draft", "rejected"].includes(
                    (s.status || "").toLowerCase()
                  );
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium text-foreground">
                          {s.jobsheetno || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.projectname || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.assignedpe_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.assignedmanager_name || "—"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatSGD(s.totalcost)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          {formatDate(pickDate(s))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {canEdit ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goEdit(s.id)}
                              className="h-8 gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goView(s.id)}
                              className="h-8 gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableCard>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <TablePagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            total={filtered.length}
          />
        )}
      </Card>
    </div>
  );
}