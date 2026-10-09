import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * TablePagination — shared table footer: per-page selector + prev/next pager.
 * Centered pager as in the design reference.
 */
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  total,
  sizeOptions = [10, 20, 50],
  className,
}) {
  const safePage = Math.min(page, Math.max(1, pageCount));
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Showing</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">· {total} total</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[60px] text-center text-xs font-medium text-foreground">
          {safePage} / {Math.max(1, pageCount)}
        </span>
        <button
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default TablePagination;