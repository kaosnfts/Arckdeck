"use client";

import * as React from "react";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";

type ArcNetworkStats = {
  blockNumber?: bigint;
  gasPrice?: bigint;
  gwei?: number;
  avgFeeUSDC?: number;
  approxTps?: number;
  updatedAt?: number;
  error?: string;
};

function toNumberSafe(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function useArcNetworkStats(pollMs = 5000, tpsBlocks = 10): ArcNetworkStats {
  const publicClient = usePublicClient();
  const [state, setState] = React.useState<ArcNetworkStats>({});

  React.useEffect(() => {
    if (!publicClient) return;

    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const [blockNumber, gasPrice] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getGasPrice(),
        ]);

        const latest = await publicClient.getBlock({ blockNumber });

        const txCount = latest.transactions?.length ?? 0;
        const gasUsed = latest.gasUsed ?? 0n;

        // avg fee per tx (very rough): (gasUsed * gasPrice) / txCount
        let avgFeeUSDC: number | undefined;
        if (txCount > 0) {
          const totalFee = gasUsed * gasPrice;
          const avgFee = totalFee / BigInt(txCount);
          avgFeeUSDC = toNumberSafe(formatUnits(avgFee, 18));
        }

        // Approx TPS over last N blocks
        const from = blockNumber - BigInt(Math.max(1, tpsBlocks - 1));
        const blocks: Array<{ ts: number; txs: number }> = [];
        for (let b = from; b <= blockNumber; b = b + 1n) {
          const blk = await publicClient.getBlock({ blockNumber: b });
          blocks.push({
            ts: Number(blk.timestamp),
            txs: blk.transactions?.length ?? 0,
          });
        }
        const t0 = blocks[0]?.ts;
        const t1 = blocks[blocks.length - 1]?.ts;
        const totalTx = blocks.reduce((a, x) => a + x.txs, 0);
        const dt = t0 && t1 && t1 > t0 ? (t1 - t0) : undefined;
        const approxTps = dt ? totalTx / dt : undefined;

        if (cancelled) return;

        setState({
          blockNumber,
          gasPrice,
          gwei: toNumberSafe(formatUnits(gasPrice, 9)),
          avgFeeUSDC,
          approxTps,
          updatedAt: Date.now(),
        });
      } catch (e: any) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          error: e?.shortMessage || e?.message || "Failed to load network stats",
        }));
      } finally {
        if (cancelled) return;
        timer = window.setTimeout(tick, pollMs);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [publicClient, pollMs, tpsBlocks]);

  return state;
}
