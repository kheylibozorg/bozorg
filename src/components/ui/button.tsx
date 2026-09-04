import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger" | "long" | "short";

const styles: Record<Variant, string> = {
  primary:
    "bg-fg text-bg hover:bg-fg/90",
  ghost:
    "bg-transparent text-fg hover:bg-surface-2",
  outline:
    "bg-transparent text-fg border border-border hover:border-border-strong hover:bg-surface",
  danger:
    "bg-short text-fg hover:bg-short/90",
  long:
    "bg-long text-accent-fg hover:bg-long/90",
  short:
    "bg-short text-fg hover:bg-short/90",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
