import * as React from "react";

import { cn } from "@/lib/cn";
import { controlClasses } from "./control-styles";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        controlClasses,
        "h-[var(--control-height,2.75rem)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
