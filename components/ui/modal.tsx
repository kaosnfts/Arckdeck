"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

export function ModalCard({
  title,
  subtitle,
  onClose,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[rgba(14,14,20,0.75)] p-6 shadow-2xl",
        "backdrop-blur-xl",
        className
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-10">
        <div className="text-lg font-semibold tracking-tight text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-white/55">{subtitle}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}
