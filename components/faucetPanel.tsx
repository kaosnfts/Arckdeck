"use client";

import * as React from "react";
import { Gift, Sparkles, Timer, ArrowRight, ExternalLink, Coins, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/confettiBurst";
import { cn } from "@/lib/utils";
import { LootboxPng } from "@/components/lootboxPng";
import { fmtNumber } from "@/lib/format";
import { env } from "@/lib/env";
import { useFaucet } from "@/hooks/useFaucet";
const BAD_FAUCET = "0xd9145cce52d386f254917e481eb44e9943f39138";

function shortAddr(addr?: string) {
  if (!addr) return "—";
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerAddressUrl(addr?: string) {
  if (!addr) return undefined;
  return `${env.ARC_EXPLORER_URL.replace(/\/$/, "")}/address/${addr}`;
}


function formatCountdown(ms?: number) {
  if (ms === undefined) return "–";
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function intFromReward(rewardUsdc?: number) {
  if (rewardUsdc === undefined || Number.isNaN(rewardUsdc)) return undefined;
  // rewards are in whole USDC steps; keep UI clean
  return Math.round(rewardUsdc);
}

function useCountUp(target?: number, active?: boolean, ms = 900) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!active || target === undefined) return;

    const start = performance.now();
    const from = 0;
    const to = Math.max(0, target);

    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      // ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);

  return value;
}

type LootboxStage = "idle" | "ready" | "opening" | "revealed" | "error";

export function FaucetPanel() {
  const { isConnected } = useAccount();
  const faucet = useFaucet(12000);

  const [lootboxOpen, setLootboxOpen] = React.useState(false);
  const [stage, setStage] = React.useState<LootboxStage>("idle");
  const [err, setErr] = React.useState<string | undefined>(undefined);
  const [tx, setTx] = React.useState<string | undefined>(undefined);
  const [reward, setReward] = React.useState<number | undefined>(undefined);
  const [confetti, setConfetti] = React.useState(false);

  const rewardInt = intFromReward(reward);
  const animated = useCountUp(rewardInt, stage === "revealed");

  const cooldown = formatCountdown(faucet.remainingMs);

  const explorerTxUrl = (hash?: string) => (hash ? `${env.ARC_EXPLORER_URL}/tx/${hash}` : undefined);

  const openLootbox = () => {
    setLootboxOpen(true);
    setStage("ready");
    setErr(undefined);
    setTx(undefined);
    setReward(undefined);
    setConfetti(false);
  };

  const closeLootbox = () => {
    setLootboxOpen(false);
    setStage("idle");
    setConfetti(false);
  };

  React.useEffect(() => {
    if (!lootboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLootbox();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lootboxOpen]);

  const onClaim = async () => {
    if (!isConnected) {
      setErr("Connect a wallet to claim.");
      setStage("error");
      return;
    }
    if (!faucet.canClaim) {
      setErr("Cooldown active. Please wait before claiming again.");
      setStage("error");
      return;
    }

    setErr(undefined);
    setTx(undefined);
    setReward(undefined);
    setConfetti(false);
    setStage("opening");

    try {
      const res = await faucet.claimLootbox();
      setTx(res?.hash);
      setReward(res?.rewardUsdc);
      setStage("revealed");
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 2600);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Claim failed");
      setStage("error");
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden border-subtle bg-surface">
        <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[rgba(85,255,187,0.16)] blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -bottom-28 h-72 w-72 rounded-full bg-[rgba(120,180,255,0.14)] blur-3xl" />

        <CardHeader>
          <CardTitle className="text-fg">Faucet</CardTitle>
          <CardDescription className="text-muted">
            Open the ArcDeck lootbox once every 24h and receive a random reward in <span className="text-fg">10 USDC</span> steps.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="nav-premium relative overflow-hidden rounded-3xl border border-subtle bg-surface-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-subtle bg-surface">
                    <Gift className="h-5 w-5 text-fg" />
                  </span>
                  <div>
                    <div className="text-lg font-semibold text-fg">Lootbox Faucet</div>
                    <div className="text-sm text-muted">Rewards: 10, 20, 30 … 200 USDC</div>
                  </div>
                </div>

                <Button
                  className="h-11 rounded-2xl px-5"
                  onClick={openLootbox}
                  disabled={!isConnected || faucet.loading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Open lootbox
                  <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-subtle bg-surface p-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Coins className="h-4 w-4" />
                    Pool balance
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-fg">{fmtNumber(faucet.faucetUsdc, 2)} USDC</div>
                </div>

                <div className="rounded-2xl border border-subtle bg-surface p-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Timer className="h-4 w-4" />
                    Cooldown
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-fg tabular-nums">{cooldown}</div>
                </div>

                <div className="rounded-2xl border border-subtle bg-surface p-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Sparkles className="h-4 w-4" />
                    Status
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-fg">{faucet.canClaim ? "Ready" : "Locked"}</div>
                </div>
              </div>

              {!isConnected ? (
                <div className="mt-4 rounded-2xl border border-subtle bg-surface p-4 text-sm text-muted">
                  Connect your wallet to use the faucet.
                </div>
              ) : null}

              {faucet.error ? (
                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  {faucet.error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-subtle bg-surface-2 p-5">
            <div className="text-sm font-semibold text-fg">Notes</div>
            <div className="mt-2 space-y-2 text-sm text-muted">
              <div>• Claims are enforced on-chain (24h cooldown).</div>
              <div>• Reward is paid in native USDC and shown after confirmation.</div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 opacity-70" />
                <a className="text-fg underline-offset-4 hover:underline" href={env.ARC_EXPLORER_URL} target="_blank" rel="noreferrer">
                  Open ArcScan
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {lootboxOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-fade-in" onClick={closeLootbox} />
          <ConfettiBurst
            active={confetti}
            className="pointer-events-none absolute inset-0 z-[2]"
            pieces={42}
          />

          <div className="relative z-[3] mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-semibold tracking-tight text-fg">ArcDeck Lootbox</div>
                <div className="mt-1 text-sm text-muted">Open to reveal today’s reward (10–200 in steps of 10).</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1",
                      env.FAUCET_CONTRACT.toLowerCase() === BAD_FAUCET
                        ? "border-red-500/30 bg-red-500/15 text-red-200"
                        : "border-subtle bg-surface text-muted"
                    )}
                    title={env.FAUCET_CONTRACT}
                  >
                    Faucet contract: {shortAddr(env.FAUCET_CONTRACT)}
                    {env.FAUCET_CONTRACT.toLowerCase() === BAD_FAUCET ? " ⚠️ WRONG" : ""}
                  </span>

                  <a
                    className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface px-3 py-1 text-muted hover:text-fg"
                    href={explorerAddressUrl(env.FAUCET_CONTRACT) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explorer <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <Button variant="secondary" className="h-11 rounded-2xl px-5" onClick={closeLootbox} disabled={stage === "opening"}>
                Close
              </Button>
            </div>

            <div className="mt-6 flex flex-1 flex-col items-center justify-center">
              <div
                className={cn(
                  "lootbox-scene nav-premium relative w-full max-w-xl overflow-hidden rounded-[32px] border border-subtle bg-surface p-8 text-center shadow-[0_18px_70px_rgba(15,23,42,0.12)] animate-pop"
                )}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(85,255,187,0.14),transparent_60%)]" />

                <div className="relative mx-auto mt-3 w-full max-w-[360px]">
                  <LootboxPng stage={stage} />
                </div>

                <div className="relative mt-8">
                  {stage === "ready" ? (
                    <>
                      <div className="text-sm text-muted">Cooldown</div>
                      <div className="mt-1 text-2xl font-semibold tabular-nums text-fg">{cooldown}</div>

                      <div className="mt-5 flex flex-col items-center gap-3">
                        <Button
                          className="h-12 w-full max-w-sm rounded-2xl"
                          onClick={onClaim}
                          disabled={!isConnected || !faucet.canClaim || faucet.claiming}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          {faucet.claiming ? "Opening…" : faucet.canClaim ? "Claim & Open" : "Locked (wait cooldown)"}
                        </Button>

                        {!isConnected ? (
                          <div className="text-sm text-muted">Connect your wallet in the top bar first.</div>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {stage === "opening" ? (
                    <>
                      <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-3 py-1 text-sm text-muted">
                        <Sparkles className="h-4 w-4" />
                        Confirming transaction…
                      </div>
                      <div className="mt-4 text-sm text-muted">Keep this tab open until the claim is confirmed.</div>
                    </>
                  ) : null}

                  {stage === "revealed" ? (
                    <>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">
                        <Sparkles className="h-4 w-4" />
                        Reward revealed
                      </div>

                      <div className="mt-5 text-sm text-muted">You won</div>
                      <div className="mt-2 lootbox-reward text-5xl font-semibold tracking-tight text-fg tabular-nums">
                        {animated} USDC
                      </div>

                      {tx ? (
                        <a
                          href={explorerTxUrl(tx)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View transaction
                        </a>
                      ) : null}

                      <div className="mt-6">
                        <Button variant="secondary" className="h-11 rounded-2xl px-6" onClick={closeLootbox}>
                          Done
                        </Button>
                      </div>
                    </>
                  ) : null}

                  {stage === "error" ? (
                    <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-left">
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-100">
                        <AlertTriangle className="h-4 w-4" />
                        Claim failed
                      </div>
                      <div className="mt-2 text-sm text-red-100/80">{err ?? "Unknown error."}</div>
                      <div className="mt-4 flex gap-3">
                        <Button className="h-11 rounded-2xl px-6" onClick={() => setStage("ready")}>
                          Back
                        </Button>
                        <Button variant="secondary" className="h-11 rounded-2xl px-6" onClick={closeLootbox}>
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-subtle">
                This lootbox uses pseudo-randomness (testnet-friendly). For provable randomness, integrate VRF.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
