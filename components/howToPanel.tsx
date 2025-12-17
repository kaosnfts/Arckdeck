"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StepCard({
  n,
  emoji,
  title,
  desc,
  badge,
  tone,
}: {
  n: number;
  emoji: string;
  title: string;
  desc: React.ReactNode;
  badge: string;
  tone: "emerald" | "sky" | "amber" | "violet" | "neutral";
}) {
  const toneMap: Record<string, { wrap: string; icon: string; badge: string }> = {
    neutral: {
      wrap: "border-subtle bg-surface-2",
      icon: "border-subtle bg-surface",
      badge: "border-subtle bg-surface text-muted",
    },
    emerald: {
      wrap: "border-emerald-300/55 bg-[linear-gradient(135deg,rgba(85,255,187,0.10),rgba(255,255,255,0.66))]",
      icon: "border-emerald-300/55 bg-[linear-gradient(135deg,rgba(85,255,187,0.35),rgba(120,180,255,0.18))]",
      badge: "border-emerald-300/55 bg-emerald-400/15 text-emerald-950",
    },
    sky: {
      wrap: "border-sky-300/55 bg-[linear-gradient(135deg,rgba(120,180,255,0.10),rgba(255,255,255,0.66))]",
      icon: "border-sky-300/55 bg-[linear-gradient(135deg,rgba(120,180,255,0.34),rgba(85,255,187,0.14))]",
      badge: "border-sky-300/55 bg-sky-400/15 text-sky-950",
    },
    amber: {
      wrap: "border-amber-300/55 bg-[linear-gradient(135deg,rgba(255,150,90,0.10),rgba(255,255,255,0.66))]",
      icon: "border-amber-300/55 bg-[linear-gradient(135deg,rgba(255,150,90,0.36),rgba(85,255,187,0.12))]",
      badge: "border-amber-300/55 bg-amber-400/15 text-amber-950",
    },
    violet: {
      wrap: "border-violet-300/55 bg-[linear-gradient(135deg,rgba(170,120,255,0.10),rgba(255,255,255,0.66))]",
      icon: "border-violet-300/55 bg-[linear-gradient(135deg,rgba(170,120,255,0.34),rgba(120,180,255,0.14))]",
      badge: "border-violet-300/55 bg-violet-400/15 text-violet-950",
    },
  };

  const t = toneMap[tone];

  return (
    <div className={cn("rounded-3xl border p-4", t.wrap)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl border", t.icon)}>
            <div className="text-lg" aria-hidden>
              {emoji}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-fg">
              {n}) {title}
            </div>
            <div className="mt-1 text-sm text-muted">{desc}</div>
          </div>
        </div>
        <Badge className={cn("rounded-2xl", t.badge)}>{badge}</Badge>
      </div>
    </div>
  );
}

export function HowToPanel() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-subtle bg-surface">
        <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[rgba(120,180,255,0.14)] blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -bottom-28 h-72 w-72 rounded-full bg-[rgba(255,150,90,0.12)] blur-3xl" />

        <CardHeader className="pb-3">
          <CardTitle className="text-fg">How to use ArcDeck</CardTitle>
          <CardDescription className="text-muted">
            Quick start: connect your wallet, make your daily check‑in, claim the faucet lootbox, and track your activity.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2">
          <StepCard
            n={1}
            emoji="🔌"
            title="Connect your wallet"
            desc={
              <>
                Click <span className="font-semibold text-fg">Connect wallet</span> in the top bar.
              </>
            }
            badge="Required"
            tone="emerald"
          />

          <StepCard
            n={2}
            emoji="📅"
            title="Daily Check‑In"
            desc={
              <>
                Open <span className="font-semibold text-fg">Daily</span> to keep your streak and earn XP/levels.
              </>
            }
            badge="Streak"
            tone="sky"
          />

          <StepCard
            n={3}
            emoji="🎁"
            title="Claim Faucet"
            desc={
              <>
                Open the lootbox and receive a random reward from{" "}
                <span className="font-semibold text-fg">10 to 200 USDC</span> (in steps of 10) every{" "}
                <span className="font-semibold text-fg">24 hours</span>.
              </>
            }
            badge="10–200 USDC"
            tone="amber"
          />

          <StepCard
            n={4}
            emoji="👛"
            title="Wallet Insights"
            desc={
              <>
                Use <span className="font-semibold text-fg">Wallet</span> to see balances and activity signals.
              </>
            }
            badge="Analytics"
            tone="violet"
          />
        </CardContent>
      </Card>

      <Card className="border-subtle bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-fg">Pro tips</CardTitle>
          <CardDescription className="text-muted">Small things that save time during testnet runs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-subtle bg-surface-2 p-4">
            <div className="text-sm font-semibold text-fg">⚠️ Not on Arc?</div>
            <div className="mt-1 text-sm text-muted">
              If you see <span className="font-semibold text-fg">Not on Arc</span>, hit{" "}
              <span className="font-semibold text-fg">Switch to Arc</span> in the top bar.
            </div>
          </div>

          <div className="rounded-3xl border border-subtle bg-surface-2 p-4">
            <div className="text-sm font-semibold text-fg">🏆 Ranking</div>
            <div className="mt-1 text-sm text-muted">
              The Ranking tab shows the top 100 wallets (local to this browser) based on Level.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
