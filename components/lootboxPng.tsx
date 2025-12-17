"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LootboxPngStage = "idle" | "ready" | "opening" | "revealed" | "error";

const DEFAULT_FRAMES = [1, 2, 3, 4].map((i) => `/box/${i}.png`);

export function LootboxPng({
  stage,
  frames = DEFAULT_FRAMES,
  className,
  alt = "ArcDeck lootbox",
}: {
  stage: LootboxPngStage;
  frames?: string[];
  className?: string;
  alt?: string;
}) {
  const safeFrames = frames.length ? frames : DEFAULT_FRAMES;
  const last = Math.max(0, safeFrames.length - 1);

  const [idx, setIdx] = React.useState(0);

  // Preload frames (best-effort)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    safeFrames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [safeFrames]);

  // Stage-driven animation
  React.useEffect(() => {
    if (stage === "opening") {
      let i = 0;
      setIdx(0);
      const t = window.setInterval(() => {
        i = (i + 1) % safeFrames.length;
        setIdx(i);
      }, 110);
      return () => window.clearInterval(t);
    }

    if (stage === "revealed") {
      setIdx(last);
      return;
    }

    // idle / ready / error
    setIdx(0);
  }, [last, safeFrames.length, stage]);

  const opening = stage === "opening";
  const revealed = stage === "revealed";

  return (
    <div
      className={cn(
        "lootbox-png-shell",
        opening && "lootbox-png-opening",
        revealed && "lootbox-png-revealed",
        className
      )}
    >
      <div className="lootbox-png-rays" />
      <div className="lootbox-png-fx" />
      <img className="lootbox-png-img" src={safeFrames[idx]} alt={alt} />
    </div>
  );
}
