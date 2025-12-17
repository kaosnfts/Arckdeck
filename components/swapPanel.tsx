"use client";

import * as React from "react";
import { ArrowLeftRight, Sparkles, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SwapPanel() {
  return (
    <Card className="relative overflow-hidden border-subtle bg-surface">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[rgba(120,180,255,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -bottom-28 h-72 w-72 rounded-full bg-[rgba(85,255,187,0.12)] blur-3xl" />

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-fg">
          <ArrowLeftRight className="h-5 w-5" />
          Swap (Soon)
          <span className="ml-2 inline-flex items-center rounded-full border border-subtle bg-surface px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
            SOON
          </span>
        </CardTitle>
        <CardDescription className="text-muted">
          This tab will enable swapping <span className="text-fg font-semibold">USDC → EURC</span> inside ArcDeck.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="nav-premium rounded-3xl border border-subtle bg-surface-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-subtle bg-surface">
                <Sparkles className="h-5 w-5 text-muted" />
              </span>
              <div>
                <div className="text-sm font-semibold text-fg">Coming soon</div>
                <div className="mt-1 text-sm text-muted">
                  You’ll be able to convert balances and interact with a swap contract (or DEX) directly from this hub.
                </div>
              </div>
            </div>

            <Button disabled className="h-11 rounded-2xl px-5" title="Swap is not available yet">
              <ArrowLeftRight className="h-4 w-4" />
              Swap USDC → EURC
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-4 py-3 text-sm text-muted">
            <Info className="h-4 w-4 opacity-70" />
            We’ll activate this once the swap route and contracts are deployed.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
