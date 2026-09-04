import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-muted", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "h-11 w-full rounded-sm border border-border bg-bg-elev px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      suppressHydrationWarning
      className={cn(
        "h-11 w-full rounded-sm border border-border bg-bg-elev px-3 text-sm text-fg outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      suppressHydrationWarning
      className={cn(
        "min-h-28 w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm text-fg outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
