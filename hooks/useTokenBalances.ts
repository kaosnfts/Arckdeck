"use client";

import * as React from "react";
import { usePublicClient } from "wagmi";
import { isAddress, getAddress } from "viem";
import { ERC20_ABI } from "@/lib/abis";
import { env } from "@/lib/env";

export type TokenBalance = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  balance?: bigint;
  loading: boolean;
  error?: string;
};

async function readToken(
  publicClient: any,
  token: `0x${string}`,
  owner: `0x${string}`,
  fallbackSymbol: string
): Promise<Omit<TokenBalance, "loading">> {
  const [symbol, decimals, balance] = await Promise.all([
    publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" }).catch(() => fallbackSymbol),
    publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" }).catch(() => 6),
    publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] }),
  ]);
  return { address: token, symbol: String(symbol), decimals: Number(decimals), balance };
}

export function useTokenBalances(owner?: string, pollMs = 8000) {
  const publicClient = usePublicClient();
  const [usdc, setUsdc] = React.useState<TokenBalance>({
    address: env.USDC_ADDRESS,
    symbol: "USDC",
    decimals: 6,
    loading: false,
  });

  React.useEffect(() => {
    if (!publicClient) return;
    const addr = owner?.trim();
    if (!addr || !isAddress(addr)) return;

    const checksum = getAddress(addr) as `0x${string}`;
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        setUsdc((p) => ({ ...p, loading: true, error: undefined }));

        const u = await readToken(publicClient, env.USDC_ADDRESS, checksum, "USDC");

        if (cancelled) return;
        setUsdc({ ...u, loading: false });
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.shortMessage || err?.message || "Failed to read balance";
        setUsdc((p) => ({ ...p, loading: false, error: msg }));
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

  return { usdc };
}
