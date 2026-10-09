import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * JobSheetLinesTable — editable line items table (no card chrome; rendered
 * inside a SectionCard body by the form). Navy/indigo uppercase column headers
 * match the design reference. Includes an empty hint state.
 */
export default function JobSheetLinesTable({
  lines,
  supervisors,
  onChangeLine,
  onAddLine,
  onDeleteLine,
  disabled,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50 text-[11px] uppercase tracking-wide text-slate-700">
            <th className="px-3 py-2.5 text-left font-semibold">Supervisor</th>
            <th className="px-3 py-2.5 text-left font-semibold">Trade</th>
            <th className="px-3 py-2.5 text-left font-semibold">Scope</th>
            <th className="px-3 py-2.5 text-left font-semibold">Cost</th>
            <th className="px-3 py-2.5 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                No lines yet.{" "}
                <button
                  type="button"
                  onClick={onAddLine}
                  className="font-medium text-primary hover:underline"
                >
                  Add a line
                </button>
              </td>
            </tr>
          ) : (
            lines.map((l) => (
              <tr key={l.key} className="transition-colors hover:bg-muted/30">
                <td className="min-w-[180px] px-3 py-2">
                  <Select
                    value={l.supervisorid}
                    onValueChange={(v) => onChangeLine(l.key, "supervisorid", v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.username}
                          {s.team ? ` · ${s.team}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={l.trade}
                    onChange={(e) => onChangeLine(l.key, "trade", e.target.value)}
                    disabled={disabled}
                    className="h-9"
                    placeholder="Trade"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={l.scope}
                    onChange={(e) => onChangeLine(l.key, "scope", e.target.value)}
                    disabled={disabled}
                    className="h-9"
                    placeholder="Scope"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    value={l.cost}
                    onChange={(e) => onChangeLine(l.key, "cost", e.target.value)}
                    disabled={disabled}
                    className="h-9 w-28"
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onDeleteLine(l.key)}
                    disabled={disabled}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    aria-label="Delete line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}