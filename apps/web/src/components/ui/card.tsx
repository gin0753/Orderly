import * as React from "react";

import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;
type CardVariant = "outlined" | "surface" | "plain";

const variantClasses: Record<CardVariant, string> = {
  outlined: "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
  surface: "bg-[var(--color-surface)] shadow-[var(--shadow-surface,0_1px_3px_rgba(0,0,0,0.1))]",
  plain: "bg-transparent",
};

export function Card({ className, variant = "outlined", ...props }: CardProps & { variant?: CardVariant }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card,1rem)]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--color-border-soft)] p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--color-border-soft)] p-5",
        className,
      )}
      {...props}
    />
  );
}
