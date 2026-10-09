import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  UserPlus,
  Pencil,
  Users as UsersIcon,
  UserCheck,
  Briefcase,
  HardHat,
  Search,
  SlidersHorizontal,
  User as UserIcon,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  List,
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
import { RolePill } from "@/components/ui/role-pill";
import { DataTableCard, EmptyState } from "@/components/ui/data-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { getGsiUser } from "@/lib/gsiUser";
import { normalizeRole } from "@/lib/roles";
import UserFormDialog from "@/components/users/UserFormDialog";

// Roles each actor may manage (in addition to the "not your own row" rule).
const MANAGEABLE_BY_ROLE = {
  team_admin: ["supervisor", "project_executive"],
  team_manager: ["team_admin"],
  director: null, // null = any role (except own row)
};

function canManageUser(actor, user) {
  if (!actor || !user) return false;
  if (actor.userId && String(user.id) === String(actor.userId)) return false;
  const actorRole = normalizeRole(actor.role);
  const rowRole = normalizeRole(user.role);
  const allowed = MANAGEABLE_BY_ROLE[actorRole];
  if (allowed === undefined) return false;
  if (allowed !== null && !allowed.includes(rowRole)) return false;
  if (actorRole !== "director") {
    if (actor.team && user.team && user.team !== actor.team) return false;
  }
  return true;
}

function compareValues(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export default function Users() {
  const gsiUser = getGsiUser();
  const actorRole = normalizeRole(gsiUser?.role);

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCaveat, setShowCaveat] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("employeeid");
  const [sortDir, setSortDir] = useState("asc");

  const loadUsers = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("getAllUsers", {});
    setUsers(res.data?.users || []);
    setLoading(false);
  };

  const loadTeams = async () => {
    const res = await base44.functions.invoke("getTeams", {});
    setTeams(res.data?.teams || []);
  };

  useEffect(() => {
    loadUsers();
    if (actorRole === "director") loadTeams();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData) => {
    const isEdit = !!editing;
    setSaving(true);
    try {
      const res = isEdit
        ? await base44.functions.invoke("updateUserRecord", {
            actedby: gsiUser.userId,
            userid: editing.id,
            username: formData.username,
            role: formData.role,
            team: formData.team,
            designation: formData.designation,
            isactive: formData.isactive,
          })
        : await base44.functions.invoke("createUserRecord", {
            actedby: gsiUser.userId,
            email: formData.email,
            username: formData.username,
            role: formData.role,
            team: formData.team,
            designation: formData.designation,
          });

      if (res?.data?.success) {
        if (isEdit) {
          toast.success("User updated.");
        } else {
          const emp = res?.data?.employeeid;
          toast.success(emp ? `User created. Employee ID: ${emp}` : "User created.");
          setShowCaveat(true);
        }
        setDialogOpen(false);
        setEditing(null);
        loadUsers();
      } else {
        toast.error(res?.data?.error || "Failed to save user.");
      }
    } catch (err) {
      const rpc = err?.response?.data;
      const msg = rpc?.error || rpc?.message || err?.message || "Failed to save user.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- Derived data ----
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isactive).length;
    const projectExecutives = users.filter(
      (u) => normalizeRole(u.role) === "project_executive"
    ).length;
    const supervisors = users.filter(
      (u) => normalizeRole(u.role) === "supervisor"
    ).length;
    return { total, active, projectExecutives, supervisors };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.email, u.employeeid, u.designation, u.role, u.team]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey]);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-4 md:p-8">
      {/* Header */}
      <PageHeader
        title="Users"
        subtitle="Manage system users and their access"
        icon={UsersIcon}
        actions={
          <Button variant="gradient" onClick={openCreate} className="h-10 gap-2 px-4">
            <UserPlus className="h-4 w-4" /> New User
          </Button>
        }
      />

      {/* Login caveat note */}
      {showCaveat && (
        <Card className="mt-6 border-blue-200 bg-blue-50/60 p-3.5 shadow-none">
          <div className="flex items-start gap-3 text-sm text-blue-800">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="flex-1">
              User profile created. They must sign in once with this email to
              activate their login.
            </p>
            <button
              onClick={() => setShowCaveat(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {/* Summary stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Total Users"
          value={stats.total}
          sublabel="Across all teams"
          tone="indigo"
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={stats.active}
          sublabel="Currently active"
          tone="emerald"
        />
        <StatCard
          icon={Briefcase}
          label="Project Executives"
          value={stats.projectExecutives}
          sublabel="Project Executive role"
          tone="orange"
        />
        <StatCard
          icon={HardHat}
          label="Supervisors"
          value={stats.supervisors}
          sublabel="Supervisor role"
          tone="pink"
        />
      </div>

      {/* Users List card */}
      <Card className="mt-6 overflow-hidden p-0">
        {/* Card header: title + controls */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <List className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Users List</p>
              <p className="text-xs text-muted-foreground">
                Showing {sorted.length} of {users.length} users
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
                placeholder="Search users..."
                className="h-9 w-full pl-9 sm:w-64"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Filter">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        {sorted.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="Try adjusting your search or create a new user."
          />
        ) : (
          <DataTableCard className="rounded-none border-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("employeeid")}
                      className="inline-flex items-center gap-1 text-white hover:opacity-90"
                    >
                      Employee ID <SortIcon col="employeeid" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("username")}
                      className="inline-flex items-center gap-1 text-white hover:opacity-90"
                    >
                      Name <SortIcon col="username" />
                    </button>
                  </TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserIcon className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-xs text-foreground">
                          {u.employeeid || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {u.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.designation || "—"}
                    </TableCell>
                    <TableCell><RolePill role={u.role} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.team || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span
                          className={
                            u.isactive
                              ? "h-2 w-2 rounded-full bg-emerald-500"
                              : "h-2 w-2 rounded-full bg-slate-400"
                          }
                        />
                        {u.isactive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {canManageUser(gsiUser, u) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(u)}
                            className="h-8 gap-1.5"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        )}

        {/* Pagination */}
        {sorted.length > 0 && (
          <TablePagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            total={sorted.length}
          />
        )}
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editing ? "edit" : "create"}
        initialUser={editing}
        gsiUser={gsiUser}
        teams={teams}
        saving={saving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}