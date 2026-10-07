import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant =
  | "brand"
  | "brandSoft"
  | "dark"
  | "secondary"
  | "outlineBrand"
  | "ghost"
  | "danger"
  | "warningSoft"
  | "successSoft";

type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  brand:
    "bg-[var(--color-brand-strong)] text-[var(--color-text-inverse)] shadow-sm hover:bg-[var(--color-text-primary)]",

  brandSoft:
    "border border-[var(--color-brand-strong)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)] hover:bg-[var(--color-surface-hover)]",

  dark: "bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] shadow-sm hover:bg-[var(--color-text-secondary)]",

  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",

  ghost:
    "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",

  danger:
    "bg-[var(--color-danger-strong)] text-[var(--color-text-inverse)] hover:brightness-90",

  outlineBrand:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-strong)] hover:bg-[var(--color-brand-strong)] hover:text-[var(--color-text-inverse)]",

  warningSoft:
    "border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] text-[var(--color-warning-strong)] hover:bg-[var(--color-brand-soft)]",

  successSoft:
    "border border-[var(--color-success-border)] bg-[var(--color-success-surface)] text-[var(--color-success-strong)] hover:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-full px-4 text-sm",
  md: "h-10 rounded-full px-5 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  icon: "h-10 w-10 rounded-full p-0",
};

export function Button({
  className,
  variant = "brand",
  size = "md",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "cursor-pointer inline-flex items-center justify-center gap-2 font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
