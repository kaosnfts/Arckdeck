import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-subtle bg-surface px-4 py-2 text-sm text-fg placeholder:text-subtle outline-none transition focus:border-[rgb(var(--ring)/0.55)] focus:bg-[rgb(var(--card)/0.85)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
