import * as React from "react";

import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-disabled)]",
        "transition focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/15",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-disabled)]",
        className,
      )}
      {...props}
    />
  );
}
