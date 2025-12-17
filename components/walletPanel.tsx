"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { ExternalLink, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { fmtUnits, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWalletAnalytics } from "@/hooks/useWalletAnalytics";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useNativeBalance } from "@/hooks/useNativeBalance";

export function WalletPanel() {
  const { address } = useAccount();
  const [target, setTarget] = React.useState<string>(address ?? "");

  React.useEffect(() => {
    if (address && !target) setTarget(address);
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const analytics = useWalletAnalytics(target, 250);
  const { usdc } = useTokenBalances(analytics.address ?? target);
  const native = useNativeBalance(analytics.address ?? target);

  const explorer = env.ARC_EXPLORER_URL.replace(/\/$/, "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted" />
              Wallet Insights
            </CardTitle>
            <CardDescription className="text-muted">
              Paste any address (or use your connected wallet) to view 
              <span className="font-semibold text-fg">interactions</span>, 
              <span className="font-semibold text-fg">unique dApps</span>, 
              <span className="font-semibold text-fg">wallet age</span>, and 
              <span className="font-semibold text-fg">live balances</span>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0x... address to analyze"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => address && setTarget(address)}
              disabled={!address}
              title={!address ? "Connect a wallet" : "Use connected wallet"}
            >
              Use my wallet
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => analytics.address && window.open(`${explorer}/address/${analytics.address}`, "_blank")}
              disabled={!analytics.isValid}
              title="Open in explorer"
            >
              <ExternalLink className="h-4 w-4" />
              Explorer
            </Button>
          </div>
        </div>

        <Separator />

        {analytics.loading ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : analytics.error ? (
          <div className="rounded-2xl border border-subtle bg-surface p-4 text-sm text-muted">
            {analytics.error}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric tone="blue" title="Interactions" value={analytics.txCount?.toString() ?? "–"} hint="Total txs seen on this network" />
            <Metric tone="emerald" title="Unique dApps" value={analytics.uniqueDapps?.toString() ?? "–"} hint="Unique destinations/contracts" />
            <Metric tone="amber" title="Wallet age" value={analytics.daysSinceFirst?.toString() ?? "–"} hint="Days since first interaction" />
            <Metric
              tone="violet"
              title="First seen"
              value={analytics.firstTxTs ? new Date(analytics.firstTxTs * 1000).toLocaleDateString() : "–"}
              hint="Date of your first activity"
            />
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-fg">Balances</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              tone="neutral"
              title="Analyzed address"
              value={analytics.isValid ? shortAddr(analytics.address ?? target, 8) : "–"}
              hint={analytics.isValid ? "Paste another address to compare" : "Enter a valid 0x address"}
            />
            <Metric
              tone="emerald"
              title="Gas balance (native USDC)"
              value={native.balance !== undefined ? `${fmtUnits(native.balance, 18, 6)} USDC` : native.loading ? "…" : "–"}
              hint="Used to pay network fees on Arc"
            />
            <Metric
              tone="blue"
              title="USDC (ERC-20)"
              value={
                usdc.balance !== undefined
                  ? `${fmtUnits(usdc.balance, usdc.decimals, 6)} ${usdc.symbol}`
                  : usdc.loading
                    ? "…"
                    : "–"
              }
              hint="Token balance in your wallet"
            />
          </div>
        </div>

        <Separator />


        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-fg">Recent transactions</h4>
          {analytics.recentTxs?.length ? (
            <div className="space-y-2">
              {analytics.recentTxs.map((t) => (
                <a
                  key={t.hash}
                  href={`${explorer}/tx/${t.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-subtle bg-surface px-4 py-3 text-sm hover:bg-[rgb(var(--muted)/0.55)]"
                >
                  <div>
                    <div className="font-medium text-fg">{shortAddr(t.hash, 6)}</div>
                    <div className="text-xs text-subtle">
                      To: {t.to ? shortAddr(t.to, 6) : "(contract creation)"} · {t.timeStamp ? new Date(Number(t.timeStamp) * 1000).toLocaleString() : ""}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-subtle" />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-subtle bg-surface p-4 text-sm text-muted">
              {analytics.loading ? "Loading…" : "No transactions to display."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  title,
  value,
  hint,
  tone = "neutral",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "emerald" | "blue" | "violet" | "amber";
}) {
  const toneCls: Record<string, string> = {
    neutral: "border-subtle bg-gradient-to-b from-white/6 to-white/4",
    emerald: "border-emerald-400/15 bg-[linear-gradient(180deg,rgba(85,255,187,0.12),rgba(255,255,255,0.03))]",
    blue: "border-sky-400/15 bg-[linear-gradient(180deg,rgba(120,180,255,0.12),rgba(255,255,255,0.03))]",
    violet: "border-violet-400/15 bg-[linear-gradient(180deg,rgba(170,120,255,0.12),rgba(255,255,255,0.03))]",
    amber: "border-amber-400/15 bg-[linear-gradient(180deg,rgba(255,170,90,0.12),rgba(255,255,255,0.03))]",
  };

  return (
    <div className={cn("rounded-2xl border p-4", toneCls[tone])}>
      <div className="text-xs text-subtle">{title}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-fg">{value}</div>
      {hint ? <div className="mt-1 text-xs text-subtle">{hint}</div> : null}
    </div>
  );
}
