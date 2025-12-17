"use client";

import * as React from "react";
import { Crown, RefreshCw, Users } from "lucide-react";
import { isAddress, getAddress } from "viem";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shortAddr } from "@/lib/format";

type RankRow = {
  address: `0x${string}`;
  level: number;
  xp: number;
  streak: number;
};

const KNOWN_WALLETS_KEY = "arcdeck:knownWallets";
const DAILY_PREFIX = "arcdeck:daily:";

function computeLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function uniqLower(list: string[]) {
  const set = new Set<string>();
  for (const v of list) {
    const s = String(v).toLowerCase();
    if (s) set.add(s);
  }
  return Array.from(set);
}

function loadKnownWallets(): `0x${string}`[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KNOWN_WALLETS_KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : [];
    const arr = Array.isArray(data) ? data.filter((v) => typeof v === "string") : [];
    const norm = uniqLower(arr);
    const out: `0x${string}`[] = [];
    for (const v of norm) {
      if (!isAddress(v)) continue;
      out.push(getAddress(v) as `0x${string}`);
    }
    return out;
  } catch {
    return [];
  }
}

function loadDailyFor(addr: `0x${string}`) {
  if (typeof window === "undefined") {
    return { xp: 0, level: 1, streak: 0 };
  }
  try {
    const raw = window.localStorage.getItem(`${DAILY_PREFIX}${addr.toLowerCase()}`);
    const data = raw ? (JSON.parse(raw) as any) : {};
    const xp = typeof data?.xp === "number" && Number.isFinite(data.xp) ? data.xp : 0;
    const streak = typeof data?.streak === "number" && Number.isFinite(data.streak) ? data.streak : 0;
    const level = typeof data?.level === "number" && Number.isFinite(data.level) ? data.level : computeLevel(xp);
    return { xp, level, streak };
  } catch {
    return { xp: 0, level: 1, streak: 0 };
  }
}

function buildRanking(): RankRow[] {
  const wallets = loadKnownWallets();
  const rows = wallets.map((address) => {
    const d = loadDailyFor(address);
    return {
      address,
      level: Math.max(1, Math.floor(d.level)),
      xp: Math.max(0, Math.floor(d.xp)),
      streak: Math.max(0, Math.floor(d.streak)),
    };
  });

  rows.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.address.localeCompare(b.address);
  });

  return rows.slice(0, 100);
}

export function RankingPanel() {
  const [rows, setRows] = React.useState<RankRow[]>([]);

  const refresh = React.useCallback(() => {
    setRows(buildRanking());
  }, []);

  React.useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === KNOWN_WALLETS_KEY || e.key.startsWith(DAILY_PREFIX)) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const totalKnown = React.useMemo(() => loadKnownWallets().length, [rows.length]);

  return (
    <Card className="relative overflow-hidden border-subtle bg-surface">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[rgba(255,150,90,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[rgba(120,180,255,0.14)] blur-3xl" />

      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-fg">Ranking</CardTitle>
            <CardDescription className="text-muted">
              Top 100 by <span className="font-semibold text-fg">Level</span> (then XP, then Streak). Based on wallets that already connected in this browser.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="border-subtle bg-surface text-muted">
              <Users className="mr-1 h-3.5 w-3.5 opacity-70" /> {totalKnown} wallets
            </Badge>
            <Button variant="secondary" onClick={refresh} className="h-11 rounded-2xl px-4">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-subtle bg-surface-2 p-6 text-sm text-muted">
            No ranking yet. Connect a wallet and do at least one Daily check‑in to start building your local leaderboard.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-subtle bg-surface-2">
            <div className="grid grid-cols-[68px_1fr_110px_110px_110px] gap-0 border-b border-subtle bg-surface px-4 py-3 text-xs font-semibold text-subtle">
              <div>#</div>
              <div>Wallet</div>
              <div className="text-right">Level</div>
              <div className="text-right">XP</div>
              <div className="text-right">Streak</div>
            </div>

            <div className="max-h-[540px] overflow-y-auto">
              {rows.map((r, i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={r.address}
                    className={cn(
                      "grid grid-cols-[68px_1fr_110px_110px_110px] items-center gap-0 px-4 py-3 text-sm",
                      "border-b border-subtle last:border-b-0",
                      isTop && "bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(255,255,255,0.55))]"
                    )}
                  >
                    <div className="tabular-nums text-muted">
                      {isTop ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-950">
                          1 <Crown className="h-4 w-4" />
                        </span>
                      ) : (
                        i + 1
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("font-semibold", isTop ? "text-amber-950" : "text-fg")} title={r.address}>
                        {shortAddr(r.address)}
                      </span>
                      {isTop ? (
                        <Badge className="border-amber-500/35 bg-amber-400/25 text-amber-950">KING</Badge>
                      ) : null}
                    </div>

                    <div className="text-right tabular-nums">
                      <Badge className={cn("border-subtle bg-surface text-fg", isTop && "border-amber-500/35 bg-amber-400/25 text-amber-950")}>
                        Lv {r.level}
                      </Badge>
                    </div>
                    <div className="text-right tabular-nums text-fg">{r.xp}</div>
                    <div className="text-right tabular-nums text-fg">{r.streak}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
