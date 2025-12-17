"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ConfettiBurst({
  active,
  className,
  pieces = 28,
}: {
  active: boolean;
  className?: string;
  pieces?: number;
}) {
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    // Re-seed so each burst looks different
    setSeed((s) => s + 1);
  }, [active]);

  if (!active) return null;

  return (
    <div
      key={seed}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {Array.from({ length: pieces }).map((_, i) => {
        const x = rand(15, 85);
        const drift = rand(-40, 40);
        const delay = rand(0, 0.18);
        const dur = rand(0.95, 1.35);
        const rot = rand(-180, 220);
        const size = rand(6, 11);
        return (
          <span
            key={i}
            className="confetti"
            style={
              {
                left: `${x}%`,
                width: `${size}px`,
                height: `${Math.max(4, size * 0.55)}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
                transform: `translate(-50%, -10px) rotate(${rot}deg)`,
                ...( { "--drift": `${drift}px` } as any ),
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
