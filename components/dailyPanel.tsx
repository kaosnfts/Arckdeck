"use client";

import * as React from "react";
import { CalendarCheck, Flame, TrendingDown, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { buildWeek, WeekRail } from "@/components/dailyWeek";
import { useDaily } from "@/components/dailyContext";

export function DailyPanel() {
  const { isConnected } = useAccount();
  const daily = useDaily();

  const week = React.useMemo(
    () => buildWeek({
      lastCheckIn: daily.lastCheckIn,
      streak: daily.streak,
      checkedDates: daily.checkedDates,
    }),
    [daily.lastCheckIn, daily.streak, daily.checkedDates]
  );

  const onCheckIn = async () => {
    try {
      await daily.checkIn();
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || "Check-in failed");
    }
  };

  const levelStart = Math.max(0, (daily.level - 1) * 100);
  const nextLevelAt = daily.level * 100;
  const into = Math.max(0, daily.xp - levelStart);
  const pct = Math.min(100, (into / 100) * 100);
  const toNext = Math.max(0, nextLevelAt - daily.xp);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-muted" />
              Daily Check-in
            </CardTitle>
            <CardDescription>
              Check in once per day to earn XP and level up. If you miss a day, you lose XP and your level can drop.
            </CardDescription>
          </div>
          <Badge className="border-subtle bg-surface">{daily.source === "onchain" ? "On-chain" : "Local fallback"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="rounded-3xl border border-subtle bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-fg">Weekly check-in</div>
              <Badge className="border-subtle bg-surface">Mon → Sun</Badge>
            </div>
            <div className="mt-4">
              <WeekRail items={week} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> Checked
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-2.5 py-1.5 text-muted">
                <span className="h-2 w-2 rounded-full bg-rose-300" /> Missed
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-2.5 py-1.5 text-muted">
                <span className="h-2 w-2 rounded-full bg-white/30" /> Upcoming
              </div>
            </div>
            <div className="mt-3 text-[11px] text-subtle">
              Past days without a check-in are marked red.
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat title="Level" value={String(daily.level)} icon={<Sparkles className="h-4 w-4" />} />
              <Stat title="XP" value={String(daily.xp)} />
              <Stat title="Streak" value={`${daily.streak} day(s)`} icon={<Flame className="h-4 w-4" />} />
            </div>

            <div className="rounded-2xl border border-subtle bg-surface p-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Progress to Level {daily.level + 1}</span>
                <span>{toNext} XP to next</span>
              </div>
              <div className="mt-2">
                <Progress value={pct} />
              </div>
            </div>

            {daily.penaltyAppliedDays ? (
              <div className="flex items-start gap-2 rounded-2xl border border-subtle bg-surface p-4 text-sm text-muted">
                <TrendingDown className="mt-0.5 h-4 w-4 text-subtle" />
                <div>
                  You missed <b>{daily.penaltyAppliedDays}</b> day(s) and XP was automatically deducted (local mode).
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted">
                {daily.canCheckIn ? "Today's check-in is available." : "You've already checked in today."}
              </div>
              <div className="text-xs text-subtle">XP updates automatically based on your streak.</div>
            </div>

            <Button
              onClick={onCheckIn}
              disabled={!isConnected || daily.checkingIn || !daily.canCheckIn}
              className="h-12 text-[15px] font-semibold"
            >
              <CalendarCheck className="h-5 w-5 opacity-80" />
              {daily.checkingIn ? "Confirming…" : "Daily check-in"}
            </Button>

            {!isConnected ? (
              <div className="text-xs text-subtle">Connect a wallet to sync on-chain (or use local fallback).</div>
            ) : daily.error ? (
              <div className="rounded-2xl border border-subtle bg-surface p-3 text-xs text-muted">
                {daily.error}
                <div className="mt-1 text-subtle">
                  If your contract ABI differs, update <code className="text-muted">hooks/useDailyCheckin.ts</code>.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-subtle bg-surface p-4">
      <div className="text-xs text-subtle">{title}</div>
      <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-fg">
        {icon}
        {value}
      </div>
    </div>
  );
}
