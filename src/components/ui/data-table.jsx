import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * DataTableCard — white card wrapper for tables.
 * Applies the shared corporate table container style (rounded card, subtle
 * border, soft shadow, no inner padding) so every table looks the same.
 */
const DataTableCard = React.forwardRef(({ className, ...props }, ref) => (
  <Card ref={ref} className={cn("overflow-hidden p-0", className)} {...props} />
));
DataTableCard.displayName = "DataTableCard";

/**
 * EmptyState — friendly centered empty message rendered inside a card.
 */
function EmptyState({ icon: Icon, title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-14 text-center",
        className
      )}
    >
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted-foreground/40" />}
      {title && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

export { DataTableCard, EmptyState };