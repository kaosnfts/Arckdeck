"use client";

import * as React from "react";
import { LayoutDashboard, Wallet, Droplets, CalendarCheck2, ArrowRight, ExternalLink, Sparkles, Trophy, BookOpen, ArrowLeftRight } from "lucide-react";

import { TopBar } from "@/components/topbar";
import { WalletPanel } from "@/components/walletPanel";
import { FaucetPanel } from "@/components/faucetPanel";
import { DailyPanel } from "@/components/dailyPanel";
import { DailyProvider, useDaily } from "@/components/dailyContext";
import { RankingPanel } from "@/components/rankingPanel";
import { HowToPanel } from "@/components/howToPanel";
import { SwapPanel } from "@/components/swapPanel";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { env } from "@/lib/env";
import { fmtNumber, shortAddr } from "@/lib/format";
import { useArcNetworkStats } from "@/hooks/useArcNetworkStats";

type ViewKey = "dashboard" | "daily" | "faucet" | "wallet" | "ranking" | "howto" | "swap";

type HubTheme = "light" | "dark";

function useStickyTheme(key: string, initial: HubTheme): [HubTheme, (t: HubTheme) => void] {
  const [theme, setTheme] = React.useState<HubTheme>(() => {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(key) as HubTheme | null;
    return raw === "dark" || raw === "light" ? raw : initial;
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, theme);
    } catch {
      // ignore
    }
  }, [key, theme]);

  return [theme, setTheme];
}

function useStickyView(key: string, initial: ViewKey): [ViewKey, (v: ViewKey) => void] {
  const [view, setView] = React.useState<ViewKey>(() => {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(key) as ViewKey | null;
    return raw ?? initial;
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, view);
    } catch {
      // ignore
    }
  }, [key, view]);

  return [view, setView];
}

function addressUrl(addr?: string) {
  if (!addr) return undefined;
  return `${env.ARC_EXPLORER_URL}/address/${addr}`;
}

function txUrl(hash?: string) {
  if (!hash) return undefined;
  return `${env.ARC_EXPLORER_URL}/tx/${hash}`;
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-subtle bg-surface px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-fg">{value}</div>
    </div>
  );
}

// How-to content was moved into its own dedicated tab (HowToPanel).

function Dashboard({ setView }: { setView: (v: ViewKey) => void }) {
  const stats = useArcNetworkStats(5000, 12);
  const daily = useDaily();

  const streakTone =
    daily.streak >= 14 ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20" :
    daily.streak >= 7 ? "bg-sky-500/15 text-sky-200 border-sky-400/20" :
    "bg-surface text-muted border-subtle";

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-subtle bg-surface">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[rgba(85,255,187,0.14)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[rgba(120,180,255,0.14)] blur-3xl" />

        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-fg">Arc Testnet Dashboard</CardTitle>
              <CardDescription className="text-muted">
                Shortcuts, status and streak highlights for your ArcNetwork testnet workflow.
              </CardDescription>
            </div>
            <div className={"rounded-2xl border px-3 py-2 text-xs " + streakTone}>
              <span className="font-semibold">Streak</span>:{" "}
              <span className="tabular-nums font-semibold">{daily.streak}</span> days ·{" "}
              <span className="text-muted">Level</span>{" "}
              <span className="tabular-nums font-semibold">{daily.level}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Chain" value={env.ARC_CHAIN_NAME} />
            <StatPill label="Block" value={stats.blockNumber ? stats.blockNumber.toString() : "–"} />
            <StatPill label="Avg fee" value={stats.avgFeeUSDC ? `${fmtNumber(stats.avgFeeUSDC, 4)} USDC` : "–"} />
            <StatPill label="TPS" value={stats.approxTps ? fmtNumber(stats.approxTps, 2) : "–"} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-subtle bg-surface-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">Daily Check‑In</div>
                    <div className="mt-1 text-sm text-muted">Open the daily view for full details.</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-subtle bg-surface">
                    <CalendarCheck2 className="h-5 w-5 text-muted" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => setView("daily")} className="h-11 w-full">
                    <span className="inline-flex items-center gap-2">
                      Open Daily
                      <ArrowRight className="h-4 w-4 opacity-70" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-subtle bg-surface-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">Faucet</div>
                    <div className="mt-1 text-sm text-muted">Claim <span className="text-fg font-semibold">10–200 USDC</span> per claim (24h cooldown).</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-subtle bg-surface">
                    <Droplets className="h-5 w-5 text-muted" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => setView("faucet")} variant="secondary" className="h-11 w-full">
                    <span className="inline-flex items-center gap-2">
                      Open Lootbox (10–200 USDC)
                      <ArrowRight className="h-4 w-4 opacity-70" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-subtle bg-surface-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">Wallet Insights</div>
                    <div className="mt-1 text-sm text-muted">Balances and basic activity signal.</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-subtle bg-surface">
                    <Wallet className="h-5 w-5 text-muted" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => setView("wallet")} variant="secondary" className="h-11 w-full">
                    <span className="inline-flex items-center gap-2">
                      Open Wallet
                      <ArrowRight className="h-4 w-4 opacity-70" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-3xl border border-subtle bg-surface-2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-subtle bg-surface">
                  <Sparkles className="h-5 w-5 text-muted" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-fg">Useful links</div>
                  <div className="mt-0.5 text-xs text-subtle">Explorer + key contracts for debugging.</div>
                </div>
              </div>

              <a
                href={env.ARC_EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-3 py-2 text-xs text-muted hover:bg-[rgb(var(--card)/0.85)]"
              >
                Open Explorer <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </div>

            <div className="mt-4 grid gap-2 text-xs">
              <a
                href={addressUrl(env.FAUCET_CONTRACT) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-subtle bg-surface px-3 py-2 text-muted hover:bg-[rgb(var(--card)/0.85)]"
              >
                <span className="font-semibold text-fg">Faucet</span>
                <span className="tabular-nums text-muted">{shortAddr(env.FAUCET_CONTRACT)}</span>
              </a>

              <a
                href={addressUrl(env.USDC_ADDRESS) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-subtle bg-surface px-3 py-2 text-muted hover:bg-[rgb(var(--card)/0.85)]"
              >
                <span className="font-semibold text-fg">USDC</span>
                <span className="tabular-nums text-muted">{shortAddr(env.USDC_ADDRESS)}</span>
              </a>

              <a
                href={addressUrl(env.DAILY_CONTRACT) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-subtle bg-surface px-3 py-2 text-muted hover:bg-[rgb(var(--card)/0.85)]"
              >
                <span className="font-semibold text-fg">Daily</span>
                <span className="tabular-nums text-muted">{shortAddr(env.DAILY_CONTRACT)}</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How-to lives in its own tab now. */}
    </div>
  );
}

export function HubApp() {
  const [view, setView] = useStickyView("arcdeck:view", "dashboard");
  const [theme, setTheme] = useStickyTheme("arcdeck:theme", "light");

  const nav = React.useMemo(
    () => [
      { key: "dashboard", label: "Dashboard", emoji: "🧭", description: "Overview & shortcuts", tone: "emerald", icon: LayoutDashboard },
      { key: "daily", label: "Daily", emoji: "📅", description: "Streak • XP • Level", tone: "sky", icon: CalendarCheck2 },
      { key: "faucet", label: "Faucet", emoji: "🎁", description: "10–200 USDC / 24h", tone: "amber", icon: Droplets },
      { key: "wallet", label: "Wallet", emoji: "👛", description: "Balances & activity", tone: "violet", icon: Wallet },
      { key: "ranking", label: "Ranking", emoji: "🏆", description: "Top 100 levels", tone: "neutral", icon: Trophy },
      { key: "howto", label: "How to use ArcDeck", emoji: "📘", description: "Quick start guide", tone: "sky", icon: BookOpen },
      { key: "swap", label: "Swap", emoji: "💱", description: "USDC → EURC", tone: "neutral", icon: ArrowLeftRight, disabled: true, badge: "SOON" },
    ],
    []
  );

  const isLight = theme === "light";
  const toggleTheme = React.useCallback(() => {
  setTheme(theme === "light" ? "dark" : "light");
}, [theme, setTheme]);


  return (
    <DailyProvider>
      <div
        className={
          (isLight ? "theme-hublight " : "") +
          "min-h-screen text-fg " +
          (isLight
            ? "bg-[radial-gradient(1200px_800px_at_20%_10%,rgba(85,255,187,0.12),transparent_55%),radial-gradient(900px_700px_at_85%_15%,rgba(120,180,255,0.14),transparent_60%),linear-gradient(180deg,rgb(248,250,252),rgb(241,245,249))]"
            : "bg-[radial-gradient(1200px_800px_at_20%_10%,rgba(85,255,187,0.10),transparent_55%),radial-gradient(900px_700px_at_85%_15%,rgba(120,180,255,0.10),transparent_60%),linear-gradient(180deg,rgb(6,6,10),rgb(10,10,18))]")
        }
      >
        <TopBar
          nav={nav as any}
          view={view}
          setView={(v) => setView(v as ViewKey)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
          {view === "dashboard" && <Dashboard setView={setView} />}
          {view === "daily" && <DailyPanel />}
          {view === "faucet" && <FaucetPanel />}
          {view === "wallet" && <WalletPanel />}
          {view === "ranking" && <RankingPanel />}
          {view === "howto" && <HowToPanel />}
          {view === "swap" && <SwapPanel />}
        </main>
      </div>
    </DailyProvider>
  );
}
