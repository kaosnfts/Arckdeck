import React from "react";
import { cn } from "../lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur " +
          "dark:border-white/10 dark:bg-white/5",
        className
      )}
      {...props}
    />
  );
}
