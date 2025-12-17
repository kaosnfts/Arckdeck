"use client";

import * as React from "react";
import { isAddress, getAddress } from "viem";

export type Tx = {
  hash: string;
  from: string;
  to?: string | null;
  timeStamp?: string; // seconds
  value?: string; // wei-like
  input?: string;
  methodId?: string;
};

export type WalletAnalytics = {
  address?: string;
  isValid: boolean;
  loading: boolean;
  error?: string;
  txCount?: number;
  uniqueDapps?: number;
  firstTxTs?: number;
  daysSinceFirst?: number;
  topDapps?: Array<{ to: string; count: number }>;
  recentTxs?: Tx[];
};

function toInt(s?: string) {
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function useWalletAnalytics(address?: string, limit = 200): WalletAnalytics {
  const [state, setState] = React.useState<WalletAnalytics>({
    address,
    isValid: false,
    loading: false,
  });

  React.useEffect(() => {
    const addr = address?.trim();
    if (!addr) {
      setState({ address: undefined, isValid: false, loading: false });
      return;
    }
    if (!isAddress(addr)) {
      setState({ address: addr, isValid: false, loading: false, error: "Invalid address" });
      return;
    }

    const checksum = getAddress(addr);
    let cancelled = false;

    const run = async () => {
      setState((p) => ({ ...p, address: checksum, isValid: true, loading: true, error: undefined }));
      try {
        const res = await fetch(`/api/txlist?address=${checksum}&limit=${limit}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Explorer API HTTP ${res.status}`);
        const data = await res.json();

        // Blockscout/Etherscan-like:
        // { status: "1", message: "OK", result: [...] }
        const result: Tx[] = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        const txs = result
          .filter((t) => t?.hash)
          .map((t) => ({
            hash: t.hash,
            from: t.from,
            to: t.to ?? null,
            timeStamp: t.timeStamp,
            value: t.value,
            input: t.input,
            methodId: t.methodId,
          }));

        if (cancelled) return;

        const txCount = txs.length;

        const counts = new Map<string, number>();
        for (const t of txs) {
          const to = t.to ? t.to.toLowerCase() : "";
          const from = t.from?.toLowerCase();
          if (!to) continue;
          if (to === from) continue;
          counts.set(to, (counts.get(to) ?? 0) + 1);
        }
        const uniqueDapps = counts.size;
        const topDapps = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([to, count]) => ({ to, count }));

        const firstTx = txs
          .map((t) => toInt(t.timeStamp))
          .filter((x): x is number => typeof x === "number")
          .sort((a, b) => a - b)[0];
        const daysSinceFirst =
          firstTx !== undefined ? Math.floor((Date.now() - firstTx * 1000) / (1000 * 60 * 60 * 24)) : undefined;

        setState({
          address: checksum,
          isValid: true,
          loading: false,
          txCount,
          uniqueDapps,
          firstTxTs: firstTx,
          daysSinceFirst,
          topDapps,
          recentTxs: txs.slice(-10).reverse(),
        });
      } catch (e: any) {
        if (cancelled) return;
        setState((p) => ({
          ...p,
          loading: false,
          error: e?.message || "Failed to load transactions",
        }));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [address, limit]);

  return state;
}
