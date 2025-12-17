"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WeekDayStatus = "checked" | "missed" | "upcoming";

export type WeekDayItem = {
  key: string;
  label: string;
  iso: string;
  isToday: boolean;
  status: WeekDayStatus;
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function startOfWeekMonday(d: Date) {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function dateFromISO(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return undefined;
  return d;
}

function expandRange(lastCheckIn?: string, streak?: number): Set<string> {
  const set = new Set<string>();
  const last = dateFromISO(lastCheckIn);
  const s = Math.max(0, streak ?? 0);
  if (!last) return set;

  if (s <= 1) {
    set.add(isoDate(last));
    return set;
  }

  const start = new Date(last);
  start.setDate(start.getDate() - (s - 1));
  for (let i = 0; i < s; i++) {
    const d = addDays(start, i);
    set.add(isoDate(d));
  }
  return set;
}

export function buildWeek(opts: {
  lastCheckIn?: string;
  streak?: number;
  checkedDates?: string[];
  now?: Date;
}): WeekDayItem[] {
  const now = opts.now ?? new Date();
  const todayIso = isoDate(now);

  // Prefer explicit checked dates (optimistic + on-chain compatible)
  const checkedSet = new Set((opts.checkedDates ?? []).filter(Boolean));
  if (checkedSet.size === 0) {
    // fallback: infer a contiguous streak range
    const inferred = expandRange(opts.lastCheckIn, opts.streak);
    inferred.forEach((v) => checkedSet.add(v));
  }

  const weekStart = startOfWeekMonday(now);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const out: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const iso = isoDate(d);
    const isToday = iso === todayIso;

    let status: WeekDayStatus = "upcoming";
    // Past or today
    if (d.getTime() <= new Date(`${todayIso}T23:59:59`).getTime()) {
      status = checkedSet.has(iso) ? "checked" : "missed";
    }

    out.push({
      key: iso,
      label: labels[i],
      iso,
      isToday,
      status,
    });
  }
  return out;
}

export function WeekStrip({ items }: { items: WeekDayItem[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {items.map((d) => (
        <div
          key={d.key}
          className={cn(
            "rounded-2xl border px-2 py-2 text-center",
            d.isToday ? "border-[rgb(var(--border)/0.85)] bg-[rgb(var(--muted)/0.55)]" : "border-subtle bg-surface"
          )}
        >
          <div className="text-[11px] text-subtle">{d.label}</div>
          <div className="mt-1 grid place-items-center">
            <Indicator status={d.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A premium, colorful week view that never "breaks" on small screens.
 * Uses a horizontal rail with overflow scroll.
 */
export function WeekRail({ items }: { items: WeekDayItem[] }) {
  return (
    <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto">
      {items.map((d) => (
        <div
          key={d.key}
          className={cn(
            "relative flex min-w-[52px] flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center",
            "transition-all duration-200",
            d.status === "checked" &&
              "border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(34,197,94,0.10))] shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
            d.status === "missed" &&
              "border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.22),rgba(239,68,68,0.08))] shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
            d.status === "upcoming" &&
              "border-subtle bg-surface",
            d.isToday && "ring-1 ring-[rgb(var(--ring)/0.35)]"
          )}
        >
          <div className="text-[10px] font-semibold text-muted">{d.label}</div>
          <div className="mt-1 grid place-items-center">
            <Indicator status={d.status} />
          </div>
          {d.isToday ? (<div className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(var(--muted-foreground)/0.35)]" />) : null}
        </div>
      ))}
    </div>
  );
}

export function WeekList({ items }: { items: WeekDayItem[] }) {
  const pretty = (iso: string) => {
    // ISO yyyy-mm-dd -> "mm/dd"
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return `${parts[1]}/${parts[2]}`;
  };

  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div
          key={d.key}
          className={cn(
            "group relative overflow-hidden rounded-2xl border px-3 py-2",
            "transition-all duration-200",
            d.status === "checked" &&
              "border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(34,197,94,0.08))]",
            d.status === "missed" &&
              "border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(239,68,68,0.06))]",
            d.status === "upcoming" && "border-subtle bg-surface",
            d.isToday && "ring-1 ring-[rgb(var(--ring)/0.35)]"
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="absolute -left-12 top-0 h-full w-24 rotate-12 bg-white/10 blur-xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <div className={cn("text-[13px] font-semibold tracking-tight", "text-fg")}>{d.label}</div>
              <div className="text-[11px] text-subtle">{pretty(d.iso)}</div>
            </div>
            <Indicator status={d.status} compact />
          </div>
        </div>
      ))}
    </div>
  );
}

function Indicator({ status, compact }: { status: WeekDayStatus; compact?: boolean }) {
  const size = compact ? "h-6 w-6" : "h-7 w-7";

  if (status === "checked") {
    return (
      <span className={cn("grid place-items-center rounded-full border", size, "border-emerald-400/25 bg-emerald-400/15")}>
        <Check className="h-3.5 w-3.5 text-emerald-200" />
      </span>
    );
  }

  if (status === "missed") {
    return (
      <span className={cn("grid place-items-center rounded-full border", size, "border-red-400/25 bg-red-400/12")}>
        <X className="h-3.5 w-3.5 text-red-200" />
      </span>
    );
  }

  return (
    <span
      className={cn("grid place-items-center rounded-full border", size, "border-white/10 bg-white/4")}
      title="Upcoming"
    >
      <span className="h-2 w-2 rounded-full bg-white/25" />
    </span>
  );
}
