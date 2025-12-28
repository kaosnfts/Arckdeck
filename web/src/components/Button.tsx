import React from "react";
import { cn } from "../lib/utils";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  as?: React.ElementType;
};

type Props = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // when `as` is provided (ex: Link), extra props are accepted via `any`
  [key: string]: any;
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  as,
  ...props
}: Props) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold " +
    "transition-all duration-200 ease-out " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-transparent " +
    "active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

  const sizes =
    size === "sm"
      ? "px-3 py-1.5 text-sm"
      : size === "lg"
      ? "px-5 py-3 text-base"
      : "px-4 py-2 text-sm";

  const primary =
    "text-white shadow-sm " +
    "bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 " +
    "hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 " +
    "before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition before:duration-200 " +
    "before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)] " +
    "hover:before:opacity-100";

  const secondary =
    "border border-slate-200 bg-white/70 text-slate-900 shadow-sm backdrop-blur " +
    "hover:bg-white hover:shadow hover:-translate-y-0.5 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10";

  const ghost =
    "text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 " +
    "dark:text-slate-200 dark:hover:bg-white/5";

  const styles =
    variant === "primary" ? primary : variant === "ghost" ? ghost : secondary;

  const Comp: any = as ?? "button";

  return (
    <Comp className={cn(base, sizes, styles, className)} {...props}>
      <span className="relative z-10 inline-flex items-center gap-2">
        {props.children}
      </span>
    </Comp>
  );
}
