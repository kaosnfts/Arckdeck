"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

/**
 * Lightweight Dialog implementation for ArcDeck.
 * This avoids additional deps (e.g., Radix) and maps to our existing Modal overlay.
 */

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const value = React.useMemo<DialogContextValue>(
    () => ({ open, setOpen: onOpenChange }),
    [open, onOpenChange]
  );
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error("DialogContent must be used within <Dialog>.");
  }

  return (
    <Modal open={ctx.open} onClose={() => ctx.setOpen(false)}>
      <div
        className={cn(
          "w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0f17]/95 p-5 shadow-2xl backdrop-blur-xl",
          className
        )}
      >
        {children}
      </div>
    </Modal>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("text-base font-semibold tracking-tight text-white", className)}>{children}</div>;
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("text-sm text-white/60", className)}>{children}</div>;
}
