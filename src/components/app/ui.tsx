import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Stat({ label, value, tone, hint }: { label: string; value: string; tone?: "good" | "bad" | "warn" | undefined; hint?: string | undefined }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl sm:text-2xl font-display font-bold num break-all", tone === "good" && "text-success", tone === "bad" && "text-destructive", tone === "warn" && "text-warning")}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-sm text-muted-foreground py-10">{children}</div>;
}

// Responsive table: scrolls inside its card only, never the page.
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto rounded-lg border bg-card">{children}</div>;
}

export const th = "text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 bg-muted whitespace-nowrap";
export const td = "px-3 py-2 text-sm border-t align-top";

export const selectCls = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";
