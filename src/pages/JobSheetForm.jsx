import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/ui/section-card";
import JobSheetLinesTable from "@/components/jobsheets/JobSheetLinesTable";
import DeleteJobsheetDialog from "@/components/jobsheets/DeleteJobsheetDialog";
import { downloadJobsheetPdf, formatSGD } from "@/lib/jobsheetPdf";
import { getGsiUser } from "@/lib/gsiUser";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Upload,
  Send,
  ArrowLeft,
  Download,
  Eraser,
  Trash2,
  RefreshCw,
  Plus,
  ClipboardList,
  ListChecks,
  FileUp,
  Check,
} from "lucide-react";

// Module-level cache for the user dropdown lists (they rarely change).
let dropdownCache = null;

const uid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const newLine = () => ({
  key: uid(),
  supervisorid: "",
  supervisorname: "",
  trade: "",
  scope: "",
  cost: "",
});
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-slate-700";

function Field({ label, required, helper, children }) {
  return (
    <div>
      <Label className={FIELD_LABEL}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

export default function JobSheetForm() {
  const navigate = useNavigate();
  const params = useParams();
  const editId = params.id || null;
  const gsiUser = getGsiUser();

  const [loading, setLoading] = useState(true);
  const [dropdowns, setDropdowns] = useState({
    directors: [],
    projectExecutives: [],
    teamManagers: [],
    supervisors: [],
  });
  const team = gsiUser?.team || "";

  const [jobsheetId, setJobsheetId] = useState(editId || null);
  const [jobsheetNo, setJobsheetNo] = useState("");
  const [status, setStatus] = useState("");
  const [quotationfilepath, setQuotationfilepath] = useState("");
  const [quotationName, setQuotationName] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectPrefix, setProjectPrefix] = useState("");
  const [assignedPE, setAssignedPE] = useState("");
  const [assignedManager, setAssignedManager] = useState("");
  const [assignedDirector, setAssignedDirector] = useState("");

  const [lines, setLines] = useState([newLine()]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  const totalCost = lines.reduce((s, l) => s + (Number(l.cost) || 0), 0);

  // Submit-for-Approval gate (strict). Save/Update stays flexible.
  const validLineCount = lines.filter(
    (l) => l.supervisorid && l.trade.trim() && l.scope.trim() && Number(l.cost) > 0
  ).length;
  const submitBlockers = [];
  if (!projectName.trim()) submitBlockers.push("Enter Project Name");
  if (!projectPrefix) submitBlockers.push("Enter Project Prefix");
  if (!assignedPE) submitBlockers.push("Select Assigned PE");
  if (!assignedManager) submitBlockers.push("Select Assigned Manager");
  if (!assignedDirector) submitBlockers.push("Select Director");
  if (validLineCount === 0)
    submitBlockers.push(
      "Add at least one line with Supervisor, Trade, Scope and Cost greater than S$0.00"
    );
  if (!quotationfilepath) submitBlockers.push("Upload a quotation");

  // Screen states
  const isSaved = !!jobsheetId;
  const isEditable =
    !isSaved || ["draft", "rejected"].includes((status || "draft").toLowerCase());
  const isViewOnly = isSaved && !isEditable;

  const statusLabel = (() => {
    if (!isSaved) return "Not Saved";
    const s = (status || "").toLowerCase();
    if (s.includes("reject")) return "Rejected";
    if (s.includes("approv")) return "Approved";
    if (s.includes("pend")) return "Pending PE";
    if (s === "draft") return "Draft";
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Draft";
  })();

  const markDirty = () => setDirty(true);

  // Load dropdown lists (cached in memory) and, in EDIT mode, the sheet fresh.
  useEffect(() => {
    (async () => {
      try {
        let dd = dropdownCache;
        if (!dd) {
          const res = await base44.functions.invoke("getJobsheetDropdowns", {});
          dd = res.data || {};
          dropdownCache = dd;
        }
        setDropdowns(dd);

        if (editId) {
          const r = await base44.functions.invoke("getJobsheet", {
            jobsheetid: editId,
          });
          const j = r.data?.jobsheet;
          const ls = r.data?.lines || [];
          if (j) {
            setJobsheetId(j.id);
            setJobsheetNo(j.jobsheetno || "");
            setStatus(j.status || "draft");
            setQuotationfilepath(j.quotationfilepath || "");
            setQuotationName(
              j.quotationfilename ||
                (j.quotationfilepath ? String(j.quotationfilepath).split("/").pop() : "")
            );
            setProjectName(j.projectname || "");
            setProjectPrefix(j.projectprefix || "");
            setAssignedPE(j.assignedpe != null ? String(j.assignedpe) : "");
            setAssignedManager(
              j.assignedmanager != null ? String(j.assignedmanager) : ""
            );
            setAssignedDirector(
              j.assigneddirector != null ? String(j.assigneddirector) : ""
            );
            setLines(
              ls.length
                ? ls.map((l) => ({
                    key: uid(),
                    supervisorid: l.supervisorid != null ? String(l.supervisorid) : "",
                    supervisorname: l.supervisorname || "",
                    trade: l.trade || "",
                    scope: l.scope || "",
                    cost: l.cost ?? "",
                  }))
                : [newLine()]
            );
          }
        }
        // Default-select the first director (NEW mode only)
        if (!editId && dd?.directors?.length) {
          setAssignedDirector((cur) => cur || String(dd.directors[0].id));
        }
      } catch (err) {
        toast.error(err?.response?.data?.error || err?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  // ── Line handlers ───────────────────────────────────────────────────────────
  const addLine = () => {
    markDirty();
    setLines((prev) => [...prev, newLine()]);
  };
  const deleteLine = (key) => {
    markDirty();
    setLines((prev) => prev.filter((l) => l.key !== key));
  };
  const changeLine = (key, field, value) =>
    setLines((prev) => {
      markDirty();
      return prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, [field]: value };
        if (field === "supervisorid") {
          const sv = dropdowns.supervisors.find((s) => String(s.id) === value);
          next.supervisorname = sv?.username || "";
        }
        return next;
      });
    });

  const handlePrefix = (v) => {
    markDirty();
    setProjectPrefix(v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5));
  };

  const buildPayloadLines = () =>
    lines
      .map((l) => ({
        supervisorid: l.supervisorid ? Number(l.supervisorid) : null,
        supervisorname: l.supervisorname,
        trade: l.trade,
        scope: l.scope,
        cost: Number(l.cost) || 0,
      }))
      .filter((l) => l.supervisorid || l.trade || l.scope || l.cost);

  // Save/Update = flexible draft: only Project Name + Prefix required.
  const validateForSave = () => {
    if (!projectName.trim()) {
      toast.error("Project Name is required");
      return false;
    }
    if (!projectPrefix) {
      toast.error("Project Prefix is required");
      return false;
    }
    return true;
  };

  // ── 1. Save (NEW only) / 2. Update (existing draft or rejected) ─────────────
  const handleSaveOrUpdate = async () => {
    if (!validateForSave()) return;

    setSaving(true);
    try {
      const res = await base44.functions.invoke("saveJobsheet", {
        jobsheetid: jobsheetId || undefined,
        projectname: projectName.trim(),
        projectprefix: projectPrefix,
        assignedpe: Number(assignedPE),
        assignedmanager: Number(assignedManager),
        assigneddirector: Number(assignedDirector),
        lines: buildPayloadLines(),
        userid: gsiUser?.userId,
        username: gsiUser?.username,
      });

      if (!res.data?.success) {
        return toast.error(res.data?.error || "Save failed");
      }

      const result = res.data.result || {};
      if (result.id) setJobsheetId(result.id);
      if (result.jobsheetno) setJobsheetNo(result.jobsheetno);
      setStatus((cur) => result.status || cur || "draft");
      setDirty(false);

      toast.success(jobsheetId ? "Job sheet updated." : "Job sheet saved.");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── 3. Download ──────────────────────────────────────────────────────────────
  const handleDownload = () => {
    downloadJobsheetPdf({
      jobsheetno: jobsheetNo,
      team,
      projectName: projectName.trim(),
      prefix: projectPrefix,
      assignedPEName: dropdowns.projectExecutives.find(
        (p) => String(p.id) === assignedPE
      )?.username,
      assignedManagerName: dropdowns.teamManagers.find(
        (m) => String(m.id) === assignedManager
      )?.username,
      assignedDirectorName: dropdowns.directors.find(
        (d) => String(d.id) === assignedDirector
      )?.username,
      lines: buildPayloadLines().map((l) => {
        const sv = dropdowns.supervisors.find(
          (s) => String(s.id) === String(l.supervisorid)
        );
        return {
          supervisorname: l.supervisorname || sv?.username || "—",
          trade: l.trade,
          scope: l.scope,
          cost: formatSGD(l.cost),
        };
      }),
      totalcost: formatSGD(totalCost),
    });
  };

  // ── 4. Upload Quotation ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    markDirty();
    const f = e.target.files?.[0] || null;
    if (f) {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      const okType =
        f.type === "application/pdf" ||
        f.type === "application/vnd.ms-excel" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const okExt = [".pdf", ".xls", ".xlsx"].includes(ext);
      if (!okType && !okExt) {
        toast.error(
          "Unsupported file type. Please upload a PDF, XLS, or XLSX quotation."
        );
        e.target.value = "";
        setPendingFile(null);
        return;
      }
    }
    setPendingFile(f);
  };

  const handleUpload = async () => {
    if (!jobsheetId || !jobsheetNo) return toast.error("Save the job sheet first");
    if (!pendingFile) return toast.error("Choose a quotation file first");

    setUploading(true);
    try {
      const base64 = await fileToBase64(pendingFile);
      const res = await base44.functions.invoke("uploadQuotation", {
        jobsheetid: jobsheetId,
        jobsheetno: jobsheetNo,
        filebase64: base64,
        filename: pendingFile.name,
        contenttype: pendingFile.type || "application/pdf",
      });

      if (!res.data?.success) {
        return toast.error(res.data?.error || "Upload failed");
      }
      setQuotationfilepath(res.data.quotationfilepath);
      setQuotationName(res.data.quotationfilename || res.data.filename || pendingFile.name);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Quotation uploaded.");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── 5. Submit for Approval ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!jobsheetId) return toast.error("Save the job sheet first");
    if (submitBlockers.length > 0)
      return toast.error("Complete all required fields before submitting");

    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitJobsheet", {
        jobsheetid: jobsheetId,
        userid: gsiUser?.userId,
        username: gsiUser?.username,
      });
      if (!res.data?.success) {
        return toast.error(res.data?.error || "Submit failed");
      }
      toast.success("Submitted for approval.");
      navigate("/job-sheets");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 6. Clear — resets the on-screen form only; no RPC, saved data untouched ──
  const handleClear = () => {
    setProjectName("");
    setProjectPrefix("");
    setAssignedPE("");
    setAssignedManager("");
    setAssignedDirector(
      dropdowns?.directors?.length ? String(dropdowns.directors[0].id) : ""
    );
    setLines([newLine()]);
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setDirty(false);
  };

  // ── 7. Delete (draft/rejected only, after confirmation) ─────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await base44.functions.invoke("deleteJobsheet", {
        jobsheetid: jobsheetId,
        userid: gsiUser?.userId,
      });
      if (!res.data?.success) {
        return toast.error(res.data?.error || "Delete failed");
      }
      toast.success("Job sheet deleted.");
      navigate("/job-sheets");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ── 8. Cancel / Back — leave without saving; confirm if there are unsaved edits
  const handleCancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    navigate("/job-sheets");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const title = isViewOnly
    ? "View Job Sheet"
    : editId
    ? "Edit Job Sheet"
    : "New Job Sheet";

  const readOnlyInput =
    "h-10 bg-muted/60 text-muted-foreground cursor-not-allowed";

  return (
    <div className="mx-auto max-w-5xl animate-fade-in p-4 md:p-8 pb-28">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm font-medium text-indigo-600">
            Status: {statusLabel}
          </p>
        </div>
      </div>

      {/* Job Sheet Details */}
      <SectionCard
        icon={ClipboardList}
        title="Job Sheet Details"
        subtitle="Enter the basic information for this job sheet"
        className="mb-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Job Sheet No">
            <Input readOnly value={jobsheetNo || "—"} className={readOnlyInput} />
          </Field>
          <Field label="Team">
            <Input readOnly value={team || "—"} className={readOnlyInput} />
          </Field>

          <Field label="Project Name" required>
            <Input
              value={projectName}
              onChange={(e) => {
                markDirty();
                setProjectName(e.target.value);
              }}
              disabled={isViewOnly}
              className="h-10"
              placeholder="Enter project name"
            />
          </Field>
          <Field
            label="Project Prefix"
            required
            helper="1–5 letters, used to build the number."
          >
            <Input
              value={projectPrefix}
              onChange={(e) => handlePrefix(e.target.value)}
              disabled={isViewOnly}
              className="h-10"
              placeholder="e.g. MSF"
              maxLength={5}
            />
          </Field>

          <Field label="Assigned PE" required>
            <Select
              value={assignedPE}
              onValueChange={(v) => {
                markDirty();
                setAssignedPE(v);
              }}
              disabled={isViewOnly}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select PE" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.projectExecutives.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assigned Manager" required>
            <Select
              value={assignedManager}
              onValueChange={(v) => {
                markDirty();
                setAssignedManager(v);
              }}
              disabled={isViewOnly}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.teamManagers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Director" required>
            <Select
              value={assignedDirector}
              onValueChange={(v) => {
                markDirty();
                setAssignedDirector(v);
              }}
              disabled={isViewOnly}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select director" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.directors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Quotation"
            helper={
              !isSaved
                ? "Save the sheet first — needs the number to store the file."
                : "Choose a PDF, XLS or XLSX file, then use Upload Quotation below."
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={!isSaved || isViewOnly}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileUp className="h-4 w-4" />
                Choose File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />
              {pendingFile ? (
                <div className="flex flex-col gap-0.5">
                  <span
                    className="max-w-[220px] truncate text-sm text-foreground"
                    title={pendingFile.name}
                  >
                    {pendingFile.name}
                  </span>
                  <span className="text-[11px] font-medium text-amber-600">
                    File selected — click Upload Quotation to save
                  </span>
                </div>
              ) : quotationfilepath ? (
                <div className="flex flex-col gap-0.5">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4 shrink-0" /> Uploaded:
                  </span>
                  <span
                    className="block max-w-full break-words text-sm font-medium text-emerald-700"
                    title={quotationName}
                  >
                    {quotationName}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No file selected
                </span>
              )}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Lines */}
      <SectionCard
        icon={ListChecks}
        title="Lines"
        subtitle="Add the line items for this job sheet"
        action={
          <button
            type="button"
            onClick={addLine}
            disabled={isViewOnly}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/25 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Line
          </button>
        }
      >
        <JobSheetLinesTable
          lines={lines}
          supervisors={dropdowns.supervisors}
          onChangeLine={changeLine}
          onAddLine={addLine}
          onDeleteLine={deleteLine}
          disabled={isViewOnly}
        />
        <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Total Cost
            </p>
            <p className="text-xl font-bold text-foreground">
              {formatSGD(totalCost)}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-20 mt-6">
        {isSaved && isEditable && submitBlockers.length > 0 && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 shadow-sm">
            <p className="mb-1 font-semibold">
              Submit for Approval is disabled. Please:
            </p>
            <ul className="list-disc space-y-0.5 pl-4">
              {submitBlockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}
        <Card className="flex flex-wrap items-center justify-end gap-3 p-4 shadow-md">
          {/* NEW (not saved): Save, Clear, Cancel */}
          {!isSaved && (
            <>
              <Button variant="primary" onClick={handleSaveOrUpdate} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
              <Button variant="tertiary" onClick={handleClear}>
                <Eraser />
                Clear
              </Button>
            </>
          )}

          {/* SAVED draft / EDIT (rejected): Update, Download, Upload Quotation, Submit, Clear, Delete */}
          {isSaved && isEditable && (
            <>
              <Button variant="primary" onClick={handleSaveOrUpdate} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Update
              </Button>
              <Button variant="secondary" onClick={handleDownload}>
                <Download />
                Download
              </Button>
              <Button
                variant="secondary"
                onClick={handleUpload}
                disabled={!pendingFile || uploading}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                Upload Quotation
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitBlockers.length > 0 || submitting}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                Submit
              </Button>
              <Button variant="tertiary" onClick={handleClear}>
                <Eraser />
                Clear
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete
              </Button>
            </>
          )}

          {/* Cancel / Back — always available */}
          <Button variant="tertiary" onClick={handleCancel}>
            {isViewOnly ? (
              <>
                <ArrowLeft />
                Back
              </>
            ) : (
              "Cancel"
            )}
          </Button>
        </Card>
      </div>

      <DeleteJobsheetDialog
        open={deleteOpen}
        jobsheetNo={jobsheetNo}
        deleting={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}