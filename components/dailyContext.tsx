"use client";

import * as React from "react";
import { useDailyCheckin } from "@/hooks/useDailyCheckin";

/**
 * Daily check-in state is consumed by both the main Daily view and the sidebar widget.
 * Using a context guarantees a single source of truth and prevents UI desync.
 */

type DailyValue = ReturnType<typeof useDailyCheckin>;

const DailyContext = React.createContext<DailyValue | null>(null);

export function DailyProvider({ children }: { children: React.ReactNode }) {
  const daily = useDailyCheckin();
  return <DailyContext.Provider value={daily}>{children}</DailyContext.Provider>;
}

export function useDaily() {
  const ctx = React.useContext(DailyContext);
  if (!ctx) {
    throw new Error("useDaily must be used within <DailyProvider />");
  }
  return ctx;
}
