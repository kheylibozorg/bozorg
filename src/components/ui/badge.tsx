import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "long" | "short" | "warn" | "fg" }) {
  const tones = {
    muted: "bg-surface-2 text-muted border-border",
    long: "bg-long-dim text-long border-long/30",
    short: "bg-short-dim text-short border-short/30",
    warn: "bg-surface-2 text-warn border-warn/30",
    fg: "bg-fg/8 text-fg border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
