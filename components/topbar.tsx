"use client";

import * as React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { isAddress, getAddress } from "viem";
import { Activity, Cpu, Layers, TimerReset, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ARC_ADD_NETWORK_PARAMS, arcTestnet } from "@/lib/arcChain";
import { fmtNumber } from "@/lib/format";
import { useArcNetworkStats } from "@/hooks/useArcNetworkStats";
import { ArcDeckMark } from "@/components/brand/ArcDeckLogo";
import { DailyTopbarWidget } from "@/components/dailyTopbarWidget";

type SwitchPhase = "idle" | "switching" | "success" | "error";

function WalletControl() {
  return (
    <ConnectButton.Custom>
      {({ account, mounted, openAccountModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && !!account;

        if (!ready) {
          return (
            <Button variant="secondary" className="h-10 w-[156px] opacity-70" disabled>
              Loading…
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button onClick={openConnectModal} className="btn-premium h-10">
              Connect wallet
            </Button>
          );
        }

        return (
          <Button
            variant="secondary"
            onClick={openAccountModal}
            className="btn-premium h-10 border-[rgb(var(--border)/0.95)] bg-[rgb(var(--card)/0.92)] shadow-[0_16px_55px_rgba(15,23,42,0.14)]"
            title="Open wallet menu"
          >
            {account.displayName}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

type NavItem = {
  key: string;
  label: string;
  emoji?: string;
  description?: string;
  tone?: "emerald" | "sky" | "amber" | "violet" | "neutral";
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
};

function ArcDeckBrand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <ArcDeckMark size={compact ? 40 : 54} className={compact ? "rounded-2xl" : "rounded-[26px]"} />
      <div className="leading-tight">
        <div className={cn("brand-title", compact ? "text-2xl" : "text-3xl")}>ArcDeck</div>
      </div>
    </div>
  );
}


function StatPill({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="flex items-center gap-2 rounded-2xl border border-subtle bg-surface px-3 py-2 text-xs text-fg"
    >
      <Icon className="h-4 w-4 text-subtle" />
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  );
}

async function ensureArcNetwork() {
  const eth = (window as any).ethereum;
  if (!eth?.request) throw new Error("No EIP-1193 wallet provider found");

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_ADD_NETWORK_PARAMS.chainId }],
    });
  } catch (e: any) {
    // 4902: chain not added
    if (e?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [ARC_ADD_NETWORK_PARAMS],
      });
      // Some wallets don't auto-switch after add. Try switching once more.
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_ADD_NETWORK_PARAMS.chainId }],
      });
      return;
    }
    throw e;
  }
}

async function getInjectedChainId(): Promise<number | undefined> {
  const eth = (window as any).ethereum;
  if (!eth?.request) return undefined;
  try {
    const cid = await eth.request({ method: "eth_chainId" });
    if (typeof cid === "string") return Number.parseInt(cid, 16);
    if (typeof cid === "number") return cid;
    return undefined;
  } catch {
    return undefined;
  }
}

export function TopBar({
  nav,
  view,
  setView,
  theme,
  onToggleTheme,
}: {
  nav: NavItem[];
  view: string;
  setView: (v: string) => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  const stats = useArcNetworkStats(5000, 10);
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  // Track wallets that have ever connected in this browser.
  // Used by the Ranking view (local-only by design).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!address || !isAddress(address)) return;
    try {
      const addr = getAddress(address).toLowerCase();
      const key = "arcdeck:knownWallets";
      const raw = window.localStorage.getItem(key);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      const arr = Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
      const next = Array.from(new Set([addr, ...arr.map((v) => String(v).toLowerCase())])).slice(0, 2500);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [address]);

  const hasInjectedProvider = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const eth = (window as any).ethereum;
    return !!eth?.request;
  }, []);

  const [switchPhase, setSwitchPhase] = React.useState<SwitchPhase>("idle");
  const [switchNote, setSwitchNote] = React.useState<string | null>(null);
  const clearTimer = React.useRef<number | null>(null);

  const setTransientNote = React.useCallback((phase: SwitchPhase, note: string, ms: number) => {
    setSwitchPhase(phase);
    setSwitchNote(note);
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => {
      setSwitchPhase("idle");
      setSwitchNote(null);
      clearTimer.current = null;
    }, ms);
  }, []);

  // Some wallets/connectors won't update wagmi's chainId reliably if the app
  // is configured with a single custom chain. To make the "Switch to Arc"
  // button work even after the user manually changes networks, we also track
  // the provider chainId via EIP-1193 (when available).
  const [eip1193ChainId, setEip1193ChainId] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth?.on) return;

    const parse = (v: any) => {
      if (typeof v === "string") {
        // e.g. "0x1"
        return Number.parseInt(v, 16);
      }
      if (typeof v === "number") return v;
      return undefined;
    };

    // Initial value
    setEip1193ChainId(parse(eth.chainId));

    const onChainChanged = (cid: any) => setEip1193ChainId(parse(cid));
    eth.on("chainChanged", onChainChanged);
    return () => {
      try {
        eth.removeListener?.("chainChanged", onChainChanged);
      } catch {
        // ignore
      }
    };
  }, []);

  const onAddOrSwitch = React.useCallback(async () => {
    if (switchPhase === "switching") return;

    setSwitchPhase("switching");
    setSwitchNote("Switching your wallet to Arc Testnet…");

    try {
      // Connected: prefer connector-native switching (best for WalletConnect / RainbowKit)
      if (isConnected) {
        try {
          const res = await switchChainAsync({ chainId: arcTestnet.id });
          if (res?.id !== arcTestnet.id) {
            throw new Error("Network switch did not complete.");
          }
          setTransientNote("success", "Done — you're on Arc Testnet.", 2200);
          return;
        } catch (err: any) {
          // If we're on an injected wallet, try the EIP-1193 flow (add/switch)
          if (hasInjectedProvider) {
            await ensureArcNetwork();
            const cid = await getInjectedChainId();
            if (cid !== arcTestnet.id) {
              throw new Error("Please approve the network switch in your wallet.");
            }
            setTransientNote("success", "Done — you're on Arc Testnet.", 2200);
            return;
          }
          throw err;
        }
      }

      // Not connected: allow adding Arc to injected wallets (useful before connecting)
      if (!hasInjectedProvider) {
        setTransientNote("error", "Connect your wallet to switch networks.", 3600);
        return;
      }

      await ensureArcNetwork();
      {
        const cid = await getInjectedChainId();
        if (cid !== arcTestnet.id) {
          throw new Error("Please approve the network switch in your wallet.");
        }
      }
      setTransientNote("success", "Arc Testnet is ready — you can connect now.", 2600);
    } catch (err: any) {
      const msg =
        err?.code === 4001
          ? "You cancelled the request in your wallet."
          : err?.shortMessage || err?.message || "Couldn't switch networks.";
      console.error(err);
      setTransientNote("error", msg, 4200);
    }
  }, [hasInjectedProvider, isConnected, setTransientNote, switchChainAsync, switchPhase]);

  const currentChainId = eip1193ChainId ?? chainId;
  // If we can't detect a chainId (e.g. no wallet injected), keep the button usable
  // so users can add Arc Testnet before connecting.
  const wrongNetwork = currentChainId ? currentChainId !== arcTestnet.id : true;
  const isLight = (theme ?? "light") === "light";
  const arcStatus = wrongNetwork
    ? {
        label: "⚠️ Not on Arc",
        cls: isLight ? "border-amber-500/35 bg-amber-400/25 text-amber-950" : "border-amber-400/25 bg-amber-500/15 text-amber-200",
      }
    : {
        label: "✅ Arc connected",
        cls: isLight ? "border-emerald-500/30 bg-emerald-400/20 text-emerald-950" : "border-emerald-400/20 bg-emerald-500/12 text-emerald-200",
      };

  const switching = switchPhase === "switching";
  const canSwitch = !switching && (wrongNetwork || !isConnected);
  const switchLabel = switching ? "Switching…" : wrongNetwork ? "Switch to Arc" : "On Arc";
  const noteTone =
    switchPhase === "success"
      ? (isLight ? "border-emerald-500/30 bg-emerald-400/20 text-emerald-950" : "border-emerald-400/20 bg-emerald-500/12 text-emerald-200")
      : switchPhase === "error"
        ? (isLight ? "border-rose-500/30 bg-rose-400/20 text-rose-950" : "border-rose-400/25 bg-rose-500/12 text-rose-200")
        : "border-subtle bg-surface text-muted";

  // Make the top menu feel like a mobile "chip row": swipe/drag to scroll horizontally.
  // (Some browsers won't reliably horizontal-scroll when the pointer starts on a <button>.)
  const navScrollRef = React.useRef<HTMLElement | null>(null);
  const navDragRef = React.useRef({
    active: false,
    moved: false,
    captured: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    pointerId: 0,
  });

  React.useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      // Only primary pointer
      if (typeof e.button === "number" && e.button !== 0) return;

      navDragRef.current.active = true;
      navDragRef.current.moved = false;
      navDragRef.current.captured = false;
      navDragRef.current.startX = e.clientX;
      navDragRef.current.startY = e.clientY;
      navDragRef.current.scrollLeft = el.scrollLeft;
      navDragRef.current.pointerId = e.pointerId;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!navDragRef.current.active) return;

      const dx = e.clientX - navDragRef.current.startX;
      const dy = e.clientY - navDragRef.current.startY;

      // Only treat it as a drag once horizontal intent is clear.
      if (Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy)) {
        navDragRef.current.moved = true;
        // Capture only once we know it's a drag; capturing on pointerdown
        // can prevent child <button> clicks from firing (click retargets to the capture element).
        if (!navDragRef.current.captured) {
          try {
            el.setPointerCapture(navDragRef.current.pointerId);
            navDragRef.current.captured = true;
          } catch {
            // ignore
          }
        }
        // Prevent the browser from turning this into a click/selection.
        e.preventDefault();
        el.scrollLeft = navDragRef.current.scrollLeft - dx;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!navDragRef.current.active) return;
      navDragRef.current.active = false;
      if (navDragRef.current.captured) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      // Clear after a short delay so a released drag doesn't trigger a click.
      if (navDragRef.current.moved) {
        window.setTimeout(() => {
          navDragRef.current.moved = false;
        }, 140);
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgb(var(--border)/0.85)] bg-[rgb(var(--background)/0.75)] backdrop-blur-xl">
      <div className="container mx-auto flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArcDeckBrand compact />
            <Badge className="border-subtle bg-surface">Arc Testnet</Badge>
          </div>

          <div className={cn("hidden lg:flex items-center gap-2", stats.error && "opacity-70")}>
            <StatPill
              icon={Activity}
              label="Gwei"
              value={stats.gwei !== undefined ? fmtNumber(stats.gwei, 3) : "–"}
              title="Gas price (gwei)"
            />
            <StatPill
              icon={Layers}
              label="Block"
              value={stats.blockNumber !== undefined ? stats.blockNumber.toString() : "–"}
            />
            <StatPill
              icon={TimerReset}
              label="Avg fee"
              value={stats.avgFeeUSDC !== undefined ? `${fmtNumber(stats.avgFeeUSDC, 6)} USDC` : "–"}
              title="Estimate (latest block)"
            />
            <StatPill
              icon={Cpu}
              label="TPS"
              value={stats.approxTps !== undefined ? fmtNumber(stats.approxTps, 2) : "–"}
              title="Approx. over recent blocks"
            />
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme ? (
              <Button
                variant="secondary"
                size="icon"
                onClick={onToggleTheme}
                className="hidden sm:inline-flex h-10 w-10 rounded-2xl"
                title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            ) : null}
            <Badge className={cn("hidden sm:inline-flex items-center gap-2", arcStatus.cls)}>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  wrongNetwork ? "bg-amber-300/90" : "bg-emerald-300/90"
                )}
              />
              {arcStatus.label}
            </Badge>
            <Button
              variant={wrongNetwork ? "default" : "secondary"}
              onClick={onAddOrSwitch}
              className={cn(
                "hidden sm:inline-flex btn-premium",
                wrongNetwork
                  ? "bg-[linear-gradient(135deg,rgba(245,158,11,0.98),rgba(249,115,22,0.96))] text-white shadow-[0_18px_55px_rgba(249,115,22,0.28)] hover:brightness-110"
                  : isLight
                    ? "border border-emerald-500/25 bg-emerald-400/15 text-emerald-950 shadow-[0_16px_55px_rgba(16,185,129,0.10)]"
                    : "border border-emerald-400/25 bg-emerald-500/12 text-emerald-100 shadow-[0_16px_55px_rgba(16,185,129,0.10)]"
              )}
              disabled={!canSwitch}
              aria-busy={switching}
              title={wrongNetwork ? "Switch your wallet network to Arc Testnet" : "You are already on Arc"}
            >
              <span className="inline-flex items-center gap-2">
                {switching && (
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border border-white/25 border-t-white/80"
                  />
                )}
                {switchLabel}
              </span>
            </Button>
            <WalletControl />
          </div>
        </div>

        {/* Mobile: network + theme controls (kept very visible) */}
        <div className="sm:hidden flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Badge className={cn("inline-flex items-center gap-2", arcStatus.cls)}>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  wrongNetwork ? "bg-amber-300/90" : "bg-emerald-300/90"
                )}
              />
              {arcStatus.label}
            </Badge>
            {onToggleTheme ? (
              <Button
                variant="secondary"
                size="icon"
                onClick={onToggleTheme}
                className="h-10 w-10 rounded-2xl"
                title={isLight ? "Dark mode" : "Light mode"}
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
          <Button
            variant={wrongNetwork ? "default" : "secondary"}
            onClick={onAddOrSwitch}
            className={cn(
              "btn-premium h-11 w-full",
              wrongNetwork
                ? "bg-[linear-gradient(135deg,rgba(245,158,11,0.98),rgba(249,115,22,0.96))] text-white shadow-[0_18px_55px_rgba(249,115,22,0.28)] hover:brightness-110"
                : isLight
                  ? "border border-emerald-500/25 bg-emerald-400/15 text-emerald-950 shadow-[0_16px_55px_rgba(16,185,129,0.10)]"
                  : "border border-emerald-400/25 bg-emerald-500/12 text-emerald-100 shadow-[0_16px_55px_rgba(16,185,129,0.10)]"
            )}
            disabled={!canSwitch}
            aria-busy={switching}
            title={wrongNetwork ? "Switch your wallet network to Arc Testnet" : "You are already on Arc"}
          >
            <span className="inline-flex items-center gap-2">
              {switching && (
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border border-white/25 border-t-white/80"
                />
              )}
              {switchLabel}
            </span>
          </Button>
        </div>

        {/* Daily check-in (horizontal, top) */}
        <DailyTopbarWidget className="w-full" variant="compact" />

        {switchNote && (
          <div className="flex items-center justify-end">
            <Badge className={cn("rounded-2xl px-3 py-2 text-xs", noteTone)}>{switchNote}</Badge>
          </div>
        )}

        {/* Top navigation (replaces the left sidebar) */}
        <div className="flex items-center justify-between gap-3">
          <nav
            ref={navScrollRef}
            className="no-scrollbar drag-scroll-x flex w-full items-center gap-2 overflow-x-auto"
            aria-label="Primary"
          >
            {nav.map((n) => {
              const Icon = n.icon;
              const active = view === n.key;
              const disabled = !!n.disabled;

              const tone = n.tone ?? "neutral";
              const toneMap: Record<string, { chip: string; icon: string }> = {
                neutral: {
                  chip: "bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(255,255,255,0.72))] border-[rgb(var(--border)/0.9)]",
                  icon: "bg-[linear-gradient(135deg,rgba(120,180,255,0.18),rgba(85,255,187,0.14))] border-[rgb(var(--border)/0.9)]",
                },
                emerald: {
                  chip: "bg-[linear-gradient(135deg,rgba(85,255,187,0.26),rgba(255,255,255,0.66))] border-emerald-300/60",
                  icon: "bg-[linear-gradient(135deg,rgba(85,255,187,0.48),rgba(120,180,255,0.26))] border-emerald-300/60",
                },
                sky: {
                  chip: "bg-[linear-gradient(135deg,rgba(120,180,255,0.26),rgba(255,255,255,0.66))] border-sky-300/60",
                  icon: "bg-[linear-gradient(135deg,rgba(120,180,255,0.48),rgba(85,255,187,0.22))] border-sky-300/60",
                },
                amber: {
                  chip: "bg-[linear-gradient(135deg,rgba(255,150,90,0.26),rgba(255,255,255,0.66))] border-amber-300/60",
                  icon: "bg-[linear-gradient(135deg,rgba(255,150,90,0.50),rgba(85,255,187,0.18))] border-amber-300/60",
                },
                violet: {
                  chip: "bg-[linear-gradient(135deg,rgba(170,120,255,0.26),rgba(255,255,255,0.66))] border-violet-300/60",
                  icon: "bg-[linear-gradient(135deg,rgba(170,120,255,0.48),rgba(120,180,255,0.20))] border-violet-300/60",
                },
              };

              const base =
                "nav-premium group inline-flex shrink-0 items-center gap-2 sm:gap-3 rounded-2xl border px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm transition-all " +
                "hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,23,42,0.16)] active:translate-y-0 active:scale-[0.99]";
              const activeCls =
                "border-[rgb(var(--border)/0.95)] bg-[rgb(var(--card)/0.92)] shadow-[0_20px_70px_rgba(15,23,42,0.18)]";
              const idleCls = `${toneMap[tone].chip} hover:bg-[rgb(var(--card)/0.90)]`;
              const disabledCls = "opacity-60 cursor-not-allowed hover:-translate-y-0 hover:shadow-none active:scale-100";

              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={(e) => {
                    // If the user was swiping/dragging the menu row, don't trigger navigation.
                    if (navDragRef.current.moved) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    if (!disabled) setView(n.key);
                  }}
                  disabled={disabled}
                  aria-current={active ? "page" : undefined}
                  className={cn(base, active ? activeCls : idleCls, disabled && disabledCls)}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl border transition",
                      toneMap[tone].icon,
                      active && "shadow-[0_16px_55px_rgba(15,23,42,0.18)]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", active ? "opacity-90" : "opacity-75")} />
                  </span>

                  <span className="flex flex-col leading-tight">
                    <span className={cn("font-semibold", active ? "text-fg" : "text-fg")}>
                      {n.label} {n.emoji ? <span className="ml-1">{n.emoji}</span> : null}
                      {n.badge ? (
                        <span className="ml-2 inline-flex items-center rounded-full border border-subtle bg-surface px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
                          {n.badge}
                        </span>
                      ) : null}
                    </span>
                    {n.description ? (
                      <span className={cn("hidden lg:block text-[11px]", active ? "text-muted" : "text-subtle")}>
                        {n.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Mobile: show a compact stat row below the nav */}
          <div className={cn("hidden md:flex items-center gap-2", stats.error && "opacity-70")}>
            <div className="hidden xl:flex items-center gap-2">
              {/* keeps layout stable on ultra-wide, but not required */}
            </div>
          </div>
        </div>

        {/* Compact stats for smaller screens */}
        <div className={cn("no-scrollbar flex items-center gap-2 overflow-x-auto lg:hidden", stats.error && "opacity-70")}>
          <StatPill
            icon={Activity}
            label="Gwei"
            value={stats.gwei !== undefined ? fmtNumber(stats.gwei, 3) : "–"}
            title="Gas price (gwei)"
          />
          <StatPill
            icon={Layers}
            label="Block"
            value={stats.blockNumber !== undefined ? stats.blockNumber.toString() : "–"}
          />
          <StatPill
            icon={TimerReset}
            label="Avg fee"
            value={stats.avgFeeUSDC !== undefined ? `${fmtNumber(stats.avgFeeUSDC, 6)} USDC` : "–"}
            title="Estimate (latest block)"
          />
          <StatPill
            icon={Cpu}
            label="TPS"
            value={stats.approxTps !== undefined ? fmtNumber(stats.approxTps, 2) : "–"}
            title="Approx. over recent blocks"
          />
        </div>
      </div>
    </header>
  );
}
