import * as React from "react";

import { cn } from "@/lib/cn";
import { controlClasses } from "./control-styles";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        controlClasses,
        "min-h-28 resize-none py-3",
        className,
      )}
      {...props}
    />
  );
}
