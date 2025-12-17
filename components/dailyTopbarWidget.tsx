"use client";

import * as React from "react";
import { CalendarCheck, Flame, Sparkles, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { buildWeek, WeekRail } from "@/components/dailyWeek";
import { useDaily } from "@/components/dailyContext";

type Variant = "compact" | "panel";


export function DailyTopbarWidget({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: Variant;
}) {
  const { isConnected } = useAccount();
  const daily = useDaily();

  const week = React.useMemo(
    () =>
      buildWeek({ lastCheckIn: daily.lastCheckIn, streak: daily.streak, checkedDates: daily.checkedDates }),
    [daily.lastCheckIn, daily.streak]
  );

  const progressPct = React.useMemo(() => {
    const xp = Number(daily.xp ?? 0);
    if (!Number.isFinite(xp)) return 0;
    const within = ((xp % 100) + 100) % 100;
    return Math.max(0, Math.min(100, within));
  }, [daily.xp]);

  const onCheckIn = async () => {
    if (!isConnected) return;
    if (!daily.canCheckIn) return;
    await daily.checkIn();
  };

  const busy = daily.loading || daily.checkingIn;

  const streakTone =
    daily.streak >= 14
      ? "border-emerald-400/25 bg-[linear-gradient(135deg,rgba(85,255,187,0.22),rgba(120,180,255,0.10))] text-emerald-100"
      : daily.streak >= 7
        ? "border-sky-400/25 bg-[linear-gradient(135deg,rgba(120,180,255,0.22),rgba(85,255,187,0.10))] text-sky-100"
        : "border-amber-400/25 bg-[linear-gradient(135deg,rgba(255,150,90,0.22),rgba(85,255,187,0.08))] text-amber-100";


  const shell =
    variant === "panel"
      ? "rounded-3xl border border-subtle bg-surface px-5 py-4 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      : "rounded-2xl border border-subtle bg-surface px-3 py-2 shadow-[0_14px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl";

  const btnLabel = !isConnected ? "Connect wallet" : daily.canCheckIn ? (busy ? "Checking…" : "Check in") : "Checked today";
  const BtnIcon = !isConnected ? Wallet : daily.canCheckIn ? CalendarCheck : Sparkles;

  return (
    <div className={cn("relative overflow-hidden", shell, className)}>
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[rgba(85,255,187,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -bottom-28 h-72 w-72 rounded-full bg-[rgba(120,180,255,0.12)] blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-2">
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-2xl border border-subtle bg-surface">
                <CalendarCheck className="h-4 w-4 text-muted" />
              </div>

              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-fg">Daily Check‑In</div>
                <div className={cn("text-[11px] text-subtle", variant === "compact" && "hidden")}>
                  Claim once per day to keep your streak and grow your level.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-2.5 py-1.5 text-[11px] text-muted">
                <Sparkles className="h-3 w-3" />
                <span>
                  Level <span className="font-semibold text-fg">{daily.level}</span>
                </span>
              </div>
              <div className={cn("inline-flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-[11px] font-semibold", streakTone)}>
                <Flame className="h-3 w-3" />
                <span>
                  Streak <span className="ml-1 text-fg text-[12px] tabular-nums">{daily.streak}</span>
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-2.5 py-1.5 text-[11px] text-muted">
                <Sparkles className="h-3 w-3" />
                <span>
                  XP <span className="font-semibold text-fg">{daily.xp}</span>
                </span>
              </div>

              <Button
                onClick={onCheckIn}
                disabled={!isConnected || busy || !daily.canCheckIn}
                className={cn("h-9 rounded-2xl px-4 text-[13px] font-semibold", (!isConnected || !daily.canCheckIn) && "opacity-75")}
                title={!isConnected ? "Connect a wallet to check in" : !daily.canCheckIn ? "You already checked in today" : undefined}
              >
                <span className="inline-flex items-center gap-2">
                  <BtnIcon className="h-4 w-4" />
                  {btnLabel}
                </span>
              </Button>
            </div>
          </div>

          {/* Rail + progress (horizontal) */}
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full items-center justify-between gap-2 overflow-x-auto">
              <WeekRail items={week} />
            </div>

            <div className="flex w-full items-center gap-2 lg:w-[300px]">
              <div className="w-full">
                <div className="mb-1 flex items-center justify-between text-[10px] text-subtle">
                  <span>Progress</span>
                  <span className="tabular-nums text-muted">{Math.round(progressPct)}%</span>
                </div>
                <Progress value={progressPct} />
              </div>
            </div>
          </div>

          {daily.error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {daily.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
