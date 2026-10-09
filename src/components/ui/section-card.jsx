import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * SectionCard — shared card with a brand-gradient header bar.
 * Header: icon tile + title + subtitle + optional action slot.
 * Body: white card content. Reused by Job Sheet Details / Lines and any
 * future screen that needs a titled section matching the app design system.
 */
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/25">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-white/80">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

export default SectionCard;