"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function ArcDeckMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center",
        "overflow-hidden rounded-2xl border border-white/10",
        "bg-white/5",
        "shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_45%)]" />
      <Image
        src="/brand/arcdeck-icon.png"
        alt="ArcDeck"
        width={512}
        height={512}
        priority
        className="h-[92%] w-[92%] object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.70)]"
      />
    </div>
  );
}

export function ArcDeckWordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ArcDeckMark size={compact ? 40 : 54} />
      <div className="leading-tight">
        <div
          className={cn(
            "text-xl font-semibold tracking-tight",
            "bg-gradient-to-r from-[rgba(85,255,187,1)] via-[rgba(120,180,255,1)] to-[rgba(255,150,90,0.95)]",
            "bg-clip-text text-transparent",
            "drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]",
            compact && "text-lg"
          )}
        >
          ArcDeck
        </div>
        <div className={cn("text-xs text-white/55", compact && "hidden")}>Progress Tracker · Faucet · Daily</div>
      </div>
    </div>
  );
}
