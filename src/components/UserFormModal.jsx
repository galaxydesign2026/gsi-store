import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ROLES = ["CEO", "Admin", "Manager", "Supervisor"];
const ROLES_WITHOUT_TEAM = ["CEO", "Admin"];

export default function UserFormModal({ user, teams, onSave, onClose, saving }) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    employeeid: "",
    email: "",
    username: "",
    role: "",
    team: "",
    isactive: true,
  });

  useEffect(() => {
    if (user) {
      setForm({
        employeeid: user.employeeid || "",
        email: user.email || "",
        username: user.username || "",
        role: user.role ? capitalizeFirst(user.role) : "",
        team: user.team || "",
        isactive: user.isactive !== undefined ? user.isactive : true,
      });
    }
  }, [user]);

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const hideTeam = ROLES_WITHOUT_TEAM.includes(form.role);
  const showTeam = form.role === "Manager" || form.role === "Supervisor";

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-clear team when role doesn't need it
      if (field === "role" && ROLES_WITHOUT_TEAM.includes(value)) {
        updated.team = "All Teams";
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showTeam && !form.team) return;
    onSave({
      ...form,
      role: form.role.toLowerCase(),
      team: hideTeam ? "All Teams" : form.team,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal — flex column so header/footer are fixed, body scrolls */}
      <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
           style={{ maxHeight: "90vh" }}>

        {/* Header — fixed, never scrolls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0 rounded-t-2xl">
          <h2 className="text-base font-bold text-foreground">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Employee ID */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Employee ID
              </label>
              <input
                type="text"
                value={form.employeeid}
                onChange={e => handleChange("employeeid", e.target.value)}
                placeholder="e.g. EMP-001"
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => handleChange("username", e.target.value)}
                placeholder="Full name"
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="email@example.com"
                disabled={isEdit}
                className={`w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                  isEdit ? "bg-muted text-muted-foreground cursor-not-allowed" : ""
                }`}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed after creation.</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Role <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={form.role}
                onChange={e => handleChange("role", e.target.value)}
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
              >
                <option value="">Select role...</option>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Team — only show for Manager / Supervisor */}
            {showTeam && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Team <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={form.team}
                  onChange={e => handleChange("team", e.target.value)}
                  className="w-full border border-input rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                >
                  <option value="">Select team...</option>
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Inactive users lose access on next login</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange("isactive", !form.isactive)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  form.isactive ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isactive ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

          </div>

          {/* Footer buttons — fixed at bottom, never hidden */}
          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}