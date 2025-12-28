import React from "react";
import { cn } from "../lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-semibold text-slate-600 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 " +
          "placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 " +
          "dark:border-white/10 dark:bg-[#0B1020] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 " +
          "placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 " +
          "dark:border-white/10 dark:bg-[#0B1020] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/20",
        className
      )}
      {...props}
    />
  );
}
