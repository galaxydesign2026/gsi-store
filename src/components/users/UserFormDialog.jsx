import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { normalizeRole } from "@/lib/roles";

const ROLE_LABELS = {
  supervisor: "Supervisor",
  project_executive: "Project Executive",
  team_manager: "Team Manager",
  team_admin: "Team Admin",
  store_admin: "Store Admin",
  director: "Director",
  operations_manager: "Operations Manager",
};

// Roles that belong to a team (require a team assignment).
const TEAM_ROLES = ["supervisor", "project_executive", "team_manager", "team_admin"];

// Which roles the logged-in actor is allowed to assign.
const ROLE_OPTIONS_BY_ACTOR = {
  team_admin: ["supervisor", "project_executive"],
  team_manager: ["team_admin"],
  director: [
    "supervisor", "project_executive", "team_manager", "team_admin",
    "store_admin", "director", "operations_manager",
  ],
};

export default function UserFormDialog({
  open, onOpenChange, mode, initialUser, gsiUser, teams, saving, onSubmit,
}) {
  const actorRole = normalizeRole(gsiUser?.role);
  const isEdit = mode === "edit";
  const teamFixed = actorRole === "team_admin" || actorRole === "team_manager";

  const buildInitial = () => {
    if (isEdit && initialUser) {
      // Normalize the stored role so it matches the SelectItem values
      // (e.g. "Team Admin" -> "team_admin"); otherwise the dropdown
      // can't match it and falls back to "Select role...".
      const role = normalizeRole(initialUser.role) || "";
      return {
        username: initialUser.username || "",
        email: initialUser.email || "",
        designation: initialUser.designation || "",
        role,
        team: initialUser.team || null,
        isactive: initialUser.isactive !== undefined ? !!initialUser.isactive : true,
      };
    }
    return {
      username: "",
      email: "",
      designation: "",
      role: "",
      // team_admin / team_manager: team is locked to their own team.
      team: teamFixed ? gsiUser?.team || null : null,
      isactive: true,
    };
  };

  const [form, setForm] = useState(buildInitial);
  const [errors, setErrors] = useState({});

  // Re-initialise whenever the dialog opens or the target user changes.
  useEffect(() => {
    if (open) {
      setForm(buildInitial());
      setErrors({});
    }
  }, [open, mode, initialUser]);

  // Roles the actor may assign. In edit mode, always include the user's
  // current role so the dropdown shows it even if the actor couldn't
  // normally assign it.
  const actorOptions = ROLE_OPTIONS_BY_ACTOR[actorRole] || [];
  const roleOptions =
    isEdit && form.role && !actorOptions.includes(form.role)
      ? [...actorOptions, form.role]
      : actorOptions;

  // Director: show the Team dropdown only for team roles; clear it for
  // company-wide roles (stored as null).
  const showTeamField =
    actorRole === "director" && TEAM_ROLES.includes(form.role);

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      team:
        actorRole === "director"
          ? TEAM_ROLES.includes(role)
            ? prev.team || ""
            : null
          : prev.team,
    }));
    setErrors((p) => ({ ...p, role: undefined, team: undefined }));
  };

  const clearError = (field) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  // Team is required for team-scoped roles. For team_admin / team_manager
  // actors the team is fixed to their own team, so it's always present.
  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Username is required.";
    if (!isEdit && !form.email.trim()) next.email = "Email is required.";
    if (!form.role) next.role = "Role is required.";
    if (showTeamField && !form.team) next.team = "Team is required for this role.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      toast.error("Please fill in all required fields.");
      return;
    }
    setErrors({});
    onSubmit({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      designation: form.designation.trim(),
      role: form.role,
      team: form.team || null,
      isactive: form.isactive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit User" : "New User"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details and access. Email cannot be changed."
              : "Create a new user profile. They must sign in once with this email to activate their login."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Username */}
          <div className="space-y-1.5">
            <Label>Username <span className="text-destructive">*</span></Label>
            <Input
              value={form.username}
              onChange={(e) => {
                setForm((p) => ({ ...p, username: e.target.value }));
                clearError("username");
              }}
              placeholder="Full name"
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Email (create only) */}
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              disabled={isEdit}
              value={form.email}
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value.toLowerCase() }));
                clearError("email");
              }}
              placeholder="email@example.com"
              className={isEdit ? "bg-muted text-muted-foreground" : ""}
            />
            {!isEdit && errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) =>
                setForm((p) => ({ ...p, designation: e.target.value }))
              }
              placeholder='e.g. "Team Admin", "HR Manager"'
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Select value={form.role} onValueChange={handleRoleChange}>
              <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Team */}
          {teamFixed && (
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Input
                disabled
                value={gsiUser?.team || ""}
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Locked to your team.
              </p>
            </div>
          )}

          {showTeamField && (
            <div className="space-y-1.5">
              <Label>Team <span className="text-destructive">*</span></Label>
              <Select
                value={form.team || ""}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, team: v }));
                  clearError("team");
                }}
              >
                <SelectTrigger className={errors.team ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.teamcode} value={t.teamcode}>
                      {t.teamcode} — {t.teamname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team && (
                <p className="text-xs text-destructive">{errors.team}</p>
              )}
            </div>
          )}

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive users lose access on next login.
                </p>
              </div>
              <Switch
                checked={form.isactive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isactive: v }))}
              />
            </div>
          )}

          <DialogFooter className="gap-2 px-0 pb-6 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="h-10">
              {saving ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}