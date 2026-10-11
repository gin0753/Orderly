import * as React from "react";

import { cn } from "@/lib/cn";
import { controlClasses } from "./control-styles";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        controlClasses,
        "h-[var(--control-height,2.75rem)]",
        className,
      )}
      {...props}
    />
  );
}
