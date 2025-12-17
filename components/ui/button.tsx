import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-premium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-[0_14px_40px_rgba(0,0,0,0.45)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-surface text-fg hover:bg-[rgb(var(--card)/0.85)] border border-subtle shadow-[0_12px_34px_rgba(0,0,0,0.25)]",
        outline:
          "border border-subtle bg-transparent text-fg hover:bg-[rgb(var(--muted)/0.45)]",
        ghost:
          "bg-transparent text-fg hover:bg-[rgb(var(--muted)/0.45)]",
        destructive:
          "bg-red-500/90 hover:bg-red-500 text-white"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 rounded-xl",
        lg: "h-12 px-6",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
