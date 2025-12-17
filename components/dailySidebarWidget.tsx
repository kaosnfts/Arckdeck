"use client";

import * as React from "react";
import { CalendarCheck, Flame, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildWeek, WeekList } from "@/components/dailyWeek";
import { Progress } from "@/components/ui/progress";
import { useDaily } from "@/components/dailyContext";

export function DailySidebarWidget() {
  const { isConnected } = useAccount();
  const daily = useDaily();

  const week = React.useMemo(
    () => buildWeek({ lastCheckIn: daily.lastCheckIn, streak: daily.streak, checkedDates: daily.checkedDates }),
    [daily.lastCheckIn, daily.streak, daily.checkedDates]
  );

  const levelStart = Math.max(0, (daily.level - 1) * 100);
  const into = Math.max(0, daily.xp - levelStart);
  const pct = Math.min(100, (into / 100) * 100);

  const onCheckIn = async () => {
    try {
      await daily.checkIn();
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || "Check-in failed");
    }
  };

  return (
    <Card id="daily-widget" className="relative overflow-hidden rounded-3xl">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[rgba(85,255,187,0.14)] blur-3xl" />
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <CalendarCheck className="h-4 w-4 text-white/70" />
          Daily Check‑In
        </CardTitle>
        <div className="mt-1 text-xs text-white/55">
          <span className="text-emerald-200 font-semibold">✓</span> checked · <span className="text-rose-200 font-semibold">✗</span> missed ·
          <span className="text-white/70"> 7‑day overview</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <WeekList items={week} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Level <span className="font-semibold text-white">{daily.level}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Flame className="h-3.5 w-3.5" />
              <span className="font-semibold text-amber-200">{daily.streak}d</span> streak
            </span>
          </div>
          <div className="mt-3">
            <Progress value={pct} />
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
              <span>{into}/100 XP</span>
              <span>Total: {daily.xp} XP</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full h-10"
            onClick={onCheckIn}
            disabled={!isConnected || !daily.canCheckIn || daily.checkingIn}
          >
            <span className="inline-flex items-center gap-2">{daily.canCheckIn ? <CalendarCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{daily.checkingIn ? "Checking in..." : daily.canCheckIn ? "Check in today" : "Checked in"}</span>
          </Button>
          {!isConnected ? (
            <div className="text-xs text-white/55">Connect your wallet to check in.</div>
          ) : daily.error ? (
            <div className="text-xs text-rose-200/80">{daily.error}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
