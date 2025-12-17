"use client";

import * as React from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog, formatUnits, getAddress, isAddress } from "viem";
import { ERC20_ABI, FAUCET_WRITE_CANDIDATES } from "@/lib/abis";
import { env } from "@/lib/env";

export type FaucetClaimResult = {
  hash: `0x${string}`;
  rewardUsdc?: number; // detected delta (ERC-20 or native)
  userUsdcAfter?: number;
  method?: string;
};

type FaucetState = {
  faucetUsdc?: number;
  lastClaimTs?: number; // seconds
  nextClaimTs?: number; // seconds
  canClaim: boolean;
  remainingMs?: number;
  loading: boolean;
  claiming: boolean;
  error?: string;
  lastTxHash?: `0x${string}`;
  lastMethod?: string;
};

const CLAIM_COOLDOWN_SECONDS = 24 * 60 * 60;

const NEXT_CLAIM_READ_CANDIDATES = ["nextClaimTime", "nextClaimTimestamp", "nextClaim"] as const;
const LAST_CLAIM_READ_CANDIDATES = ["lastClaim", "lastClaimTime", "lastClaimed", "lastRequest", "last"] as const;

const FAUCET_CLAIMED_EVENT_ABI = [
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "reward", type: "uint256" },
      { indexed: false, name: "nextTime", type: "uint256" },
    ],
  },
] as const;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function lsKey(addr: string) {
  return `arcdeck:faucet:lastClaim:${addr.toLowerCase()}`;
}

// viem can infer `unknown` for dynamic ABI + functionName. Normalize safely.
function toBigInt(raw: unknown): bigint {
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number") return BigInt(Math.trunc(raw));
  if (typeof raw === "string") return BigInt(raw);
  return BigInt((raw as any) ?? 0);
}

// Decode reward with the correct decimals. Arc faucet rewards are 10–200 USDC (steps of 10).
function decodeReward(reward: bigint, preferredDecimals?: number): number {
  const candidates = [preferredDecimals, 6, 18].filter((d): d is number => typeof d === "number");
  const uniq = Array.from(new Set(candidates));

  const vals = uniq
    .map((dec) => ({ dec, v: Number(formatUnits(reward, dec)) }))
    .filter((x) => Number.isFinite(x.v) && x.v > 0);

  const isStep10 = (x: number) => Math.abs(x / 10 - Math.round(x / 10)) < 1e-9;
  const plausible = vals.find(({ v }) => v >= 10 && v <= 200 && isStep10(v));

  return (plausible ?? vals[0] ?? { v: 0 }).v;
}

async function readUsdcBalanceRaw(
  publicClient: any,
  owner: `0x${string}`
): Promise<{ raw: bigint; decimals: number; n: number }> {
  const [decimals, bal] = await Promise.all([
    publicClient
      .readContract({ address: env.USDC_ADDRESS, abi: ERC20_ABI, functionName: "decimals" })
      .catch(() => 6),
    publicClient.readContract({
      address: env.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }),
  ]);

  const dec = Number(decimals) || 6;
  const raw = bal as bigint;
  return { raw, decimals: dec, n: Number(formatUnits(raw, dec)) };
}

// If Arc uses USDC-style native balance, treat native decimals as 6 to avoid showing 0.
async function readNativeBalanceRaw(
  publicClient: any,
  owner: `0x${string}`
): Promise<{ raw: bigint; decimals: number; n: number }> {
  const raw = (await publicClient.getBalance({ address: owner })) as bigint;
  const decimals = 6;
  const n = Number(formatUnits(raw, decimals));
  return { raw, decimals, n };
}

async function readUsdcContractBalance(publicClient: any, owner: `0x${string}`): Promise<number | undefined> {
  try {
    const v = await readUsdcBalanceRaw(publicClient, owner);
    return v.n;
  } catch {
    return undefined;
  }
}

function makeReadAbi(name: string) {
  return [
    {
      type: "function",
      name,
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;
}

function makeWriteAbi(name: string) {
  return [
    {
      type: "function",
      name,
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
  ] as const;
}

export function useFaucet(pollMs = 12000) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = React.useState<FaucetState>({
    canClaim: false,
    loading: false,
    claiming: false,
  });

  // UI countdown
  React.useEffect(() => {
    const t = window.setInterval(() => {
      setState((p) => {
        if (!p.nextClaimTs) return p;
        const rem = Math.max(0, p.nextClaimTs - nowSeconds());
        return { ...p, remainingMs: rem * 1000, canClaim: rem === 0 };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  // Poll faucet pool + cooldown
  React.useEffect(() => {
    if (!publicClient) return;

    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        setState((p) => ({ ...p, loading: true, error: undefined }));

        const faucetUsdc = await readUsdcContractBalance(publicClient, env.FAUCET_CONTRACT as `0x${string}`);

        let lastClaimTs: number | undefined;
        if (address && isAddress(address)) {
          const checksum = getAddress(address) as `0x${string}`;

          for (const fn of LAST_CLAIM_READ_CANDIDATES) {
            try {
              const raw = await publicClient.readContract({
                address: env.FAUCET_CONTRACT as `0x${string}`,
                abi: makeReadAbi(fn),
                functionName: fn,
                args: [checksum],
              } as any);

              const v = toBigInt(raw);
              const ts = Number(v);
              if (Number.isFinite(ts) && ts > 0) {
                lastClaimTs = ts;
                break;
              }
            } catch {
              // ignore
            }
          }

          // Local fallback
          if (!lastClaimTs) {
            try {
              const raw = window.localStorage.getItem(lsKey(checksum));
              const n = raw ? Number(raw) : undefined;
              if (n && Number.isFinite(n)) lastClaimTs = n;
            } catch {}
          }
        }

        // Prefer on-chain "next claim" if the faucet exposes it.
        let nextClaimTsOnchain: number | undefined;
        if (address && isAddress(address)) {
          const checksum = getAddress(address) as `0x${string}`;
          for (const fn of NEXT_CLAIM_READ_CANDIDATES) {
            try {
              const raw = await publicClient.readContract({
                address: env.FAUCET_CONTRACT as `0x${string}`,
                abi: makeReadAbi(fn),
                functionName: fn,
                args: [checksum],
              } as any);

              const v = toBigInt(raw);
              const ts = Number(v);
              if (Number.isFinite(ts) && ts > 0) {
                nextClaimTsOnchain = ts;
                break;
              }
            } catch {
              // ignore
            }
          }
        }

        const nextClaimTs =
          nextClaimTsOnchain ?? (lastClaimTs ? lastClaimTs + CLAIM_COOLDOWN_SECONDS : undefined);
        const rem = nextClaimTs ? Math.max(0, nextClaimTs - nowSeconds()) : 0;

        if (cancelled) return;
        setState((p) => ({
          ...p,
          loading: false,
          faucetUsdc,
          lastClaimTs,
          nextClaimTs,
          remainingMs: rem * 1000,
          canClaim: rem === 0,
        }));
      } catch (e: any) {
        if (cancelled) return;
        setState((p) => ({
          ...p,
          loading: false,
          error: e?.shortMessage || e?.message || "Failed to read faucet status",
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
  }, [publicClient, address, pollMs]);

  const claimLootbox = React.useCallback(async (): Promise<FaucetClaimResult> => {
    if (!publicClient) throw new Error("RPC not available");
    if (!address || !isAddress(address)) throw new Error("Connect a wallet");
    if (!state.canClaim) throw new Error("Please wait for the 24h cooldown");

    setState((p) => ({ ...p, claiming: true, error: undefined, lastTxHash: undefined }));

    const checksum = getAddress(address) as `0x${string}`;
    const before = await readUsdcBalanceRaw(publicClient, checksum).catch(() => undefined);
    const beforeNative = await readNativeBalanceRaw(publicClient, checksum).catch(() => undefined);

    let lastErr: any;

    for (const fn of FAUCET_WRITE_CANDIDATES) {
      try {
        await publicClient.simulateContract({
          address: env.FAUCET_CONTRACT as `0x${string}`,
          abi: makeWriteAbi(fn),
          functionName: fn,
          account: checksum,
        } as any);

        const hash = (await writeContractAsync({
          address: env.FAUCET_CONTRACT as `0x${string}`,
          abi: makeWriteAbi(fn),
          functionName: fn,
        } as any)) as `0x${string}`;

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Decode Claimed(user,reward,nextTime) if available (preferred).
        let rewardFromEvent: number | undefined;
        try {
          for (const log of receipt.logs) {
            if (!log?.topics?.length) continue;
            if ((log.address ?? "").toLowerCase() !== (env.FAUCET_CONTRACT as string).toLowerCase()) continue;

            try {
              const decoded = decodeEventLog({
                abi: FAUCET_CLAIMED_EVENT_ABI,
                data: log.data,
                topics: log.topics,
              } as any) as any;

              if (decoded?.eventName !== "Claimed") continue;
              const user = decoded?.args?.user as `0x${string}` | undefined;
              const reward = decoded?.args?.reward as bigint | undefined;

              if (user && getAddress(user) === checksum && typeof reward === "bigint") {
                rewardFromEvent = decodeReward(reward, before?.decimals);
                break;
              }
            } catch {
              // ignore non-matching logs
            }
          }
        } catch {
          // ignore
        }

        // Optimistic local cooldown
        try {
          window.localStorage.setItem(lsKey(checksum), String(nowSeconds()));
        } catch {}

        const after = await readUsdcBalanceRaw(publicClient, checksum).catch(() => undefined);
        const afterNative = await readNativeBalanceRaw(publicClient, checksum).catch(() => undefined);

        let rewardUsdc: number | undefined;
        let userUsdcAfter: number | undefined;

        if (rewardFromEvent && rewardFromEvent > 0) {
          rewardUsdc = rewardFromEvent;
        }

        if (before && after && after.decimals === before.decimals) {
          const deltaRaw = after.raw - before.raw;
          const delta = deltaRaw > 0n ? Number(formatUnits(deltaRaw, after.decimals)) : 0;
          if (rewardUsdc === undefined) rewardUsdc = delta;
          userUsdcAfter = after.n;
        }

        if (
          (!rewardUsdc || rewardUsdc === 0) &&
          beforeNative &&
          afterNative &&
          afterNative.decimals === beforeNative.decimals
        ) {
          const deltaRaw = afterNative.raw - beforeNative.raw;
          const delta = deltaRaw > 0n ? Number(formatUnits(deltaRaw, afterNative.decimals)) : 0;
          if (delta > 0 && rewardUsdc === undefined) rewardUsdc = delta;
        }

        setState((p) => ({
          ...p,
          claiming: false,
          lastTxHash: hash,
          lastMethod: fn,
          lastClaimTs: nowSeconds(),
          nextClaimTs: nowSeconds() + CLAIM_COOLDOWN_SECONDS,
          canClaim: false,
        }));

        return { hash, rewardUsdc, userUsdcAfter, method: fn };
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }

    setState((p) => ({
      ...p,
      claiming: false,
      error:
        lastErr?.shortMessage ||
        lastErr?.message ||
        "Unable to execute faucet claim. Update candidates in lib/abis.ts if your contract uses different function names.",
    }));
    throw lastErr;
  }, [publicClient, writeContractAsync, address, state.canClaim]);

  return { ...state, claim: claimLootbox, claimLootbox };
}
