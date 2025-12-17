"use client";

import * as React from "react";
import { usePublicClient } from "wagmi";
import { isAddress, getAddress } from "viem";

export function useNativeBalance(owner?: string, pollMs = 8000) {
  const publicClient = usePublicClient();
  const [balance, setBalance] = React.useState<{
    balance?: bigint;
    loading: boolean;
    error?: string;
  }>({ loading: false });

  React.useEffect(() => {
    if (!publicClient) return;
    const addr = owner?.trim();
    if (!addr || !isAddress(addr)) return;

    const checksum = getAddress(addr) as `0x${string}`;
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        setBalance((p) => ({ ...p, loading: true, error: undefined }));
        const bal = await publicClient.getBalance({ address: checksum });
        if (cancelled) return;
        setBalance({ balance: bal, loading: false });
      } catch (err: any) {
        if (cancelled) return;
        setBalance({ loading: false, error: err?.message || "Failed to read native balance" });
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
  }, [publicClient, owner, pollMs]);

  return balance;
}
