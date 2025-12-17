"use client";

import * as React from "react";
import { ArrowRight, ExternalLink, Gift, Layers, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArcDeckMark } from "@/components/brand/ArcDeckLogo";

type Phase = "landing" | "entering" | "app";

export function EntryGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = React.useState<Phase>("landing");

  const enter = React.useCallback(() => {
    if (phase !== "landing") return;
    setPhase("entering");
    window.setTimeout(() => setPhase("app"), 560);
  }, [phase]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "landing") return;
      if (e.key === "Enter") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter, phase]);

  return (
    <div className="min-h-screen">
      {/* App (fades in) */}
      <div
        className={cn(
          "min-h-screen transition-all duration-700 ease-out",
          phase === "landing"
            ? "pointer-events-none opacity-0 blur-[2px] translate-y-2"
            : "opacity-100 blur-0 translate-y-0",
          phase === "entering" && "animate-[fadeUp_700ms_ease-out]"
        )}
      >
        {children}
      </div>

      {/* Landing */}
      <div
        className={cn(
          "fixed inset-0 z-50 grid place-items-center px-4 transition-opacity duration-700 ease-out",
          phase === "landing" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={phase !== "landing"}
      >
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(85,255,187,0.18),transparent_52%),radial-gradient(circle_at_82%_16%,rgba(120,180,255,0.18),transparent_56%),radial-gradient(circle_at_50%_95%,rgba(255,150,90,0.10),transparent_56%)]" />
          <div className="absolute inset-0 opacity-[0.10] [background:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:26px_26px]" />
          <div className="absolute inset-0 opacity-45 [mask-image:radial-gradient(ellipse_at_center,black_52%,transparent_82%)]">
            <div className="absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full bg-[rgba(85,255,187,0.18)] blur-3xl" />
            <div className="absolute -right-44 -bottom-44 h-[720px] w-[720px] rounded-full bg-[rgba(120,180,255,0.16)] blur-3xl" />
          </div>
        </div>

        <div className="w-full max-w-[520px]">
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(14,14,20,0.62)] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.70)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_92%)]">
              <div className="absolute inset-0 [background:conic-gradient(from_210deg,rgba(85,255,187,0.10),rgba(120,180,255,0.10),rgba(255,150,90,0.06),rgba(85,255,187,0.10))]" />
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="float">
                <ArcDeckMark size={232} className="rounded-[54px]" />
              </div>

              <div className="mt-7 brand-title text-6xl md:text-7xl">ArcDeck</div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <Layers className="h-3.5 w-3.5 text-white/60" />
                  <span className="font-semibold text-white/80">Arc Testnet</span>
                  <span className="text-white/45">hub</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <Wallet className="h-3.5 w-3.5 text-white/60" />
                  <span className="font-semibold text-white/80">Wallet</span>
                  <span className="text-white/45">insights</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-[linear-gradient(135deg,rgba(255,150,90,0.18),rgba(255,255,255,0.06))] px-3 py-1.5">
                  <Gift className="h-3.5 w-3.5 text-amber-200" />
                  <span className="font-semibold text-white/90">Faucet</span>
                  <span className="text-white/65">10–200 USDC / 24h</span>
                </span>
              </div>

              <div className="mt-8 w-full">
                <Button onClick={enter} className="h-12 w-full text-base font-semibold">
                  Enter <ArrowRight className="h-5 w-5" />
                </Button>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a
                    className={cn(
                      "btn-premium inline-flex h-11 items-center justify-between gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all",
                      "border-white/12 bg-[linear-gradient(135deg,rgba(255,150,90,0.18),rgba(85,255,187,0.10))] text-white/90",
                      "hover:-translate-y-0.5 hover:bg-white/8 active:translate-y-0"
                    )}
                    href="https://x.com/kAosNFTs"
                    target="_blank"
                    rel="noreferrer"
                    title="Follow @kAosNFTs on X"
                  >
                    <span className="text-base">𝕏</span>
                    Follow kAosNFTs
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </a>

                  <a
                    className={cn(
                      "btn-premium inline-flex h-11 items-center justify-between gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all",
                      "border-white/12 bg-[linear-gradient(135deg,rgba(120,180,255,0.18),rgba(85,255,187,0.10))] text-white/90",
                      "hover:-translate-y-0.5 hover:bg-white/8 active:translate-y-0"
                    )}
                    href="https://x.com/arc"
                    target="_blank"
                    rel="noreferrer"
                    title="Follow Arc Network on X"
                  >
                    <span className="text-base">𝕏</span>
                    Follow Arc
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </a>
                </div>

                <div className="mt-3 text-xs text-white/45">
                  Tip: press{" "}
                  <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/70">
                    Enter
                  </span>{" "}
                  to continue.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
