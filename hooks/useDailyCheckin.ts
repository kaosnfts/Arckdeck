"use client";

import * as React from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { getAddress, isAddress } from "viem";
import { DAILY_WRITE_CANDIDATES } from "@/lib/abis";
import { env } from "@/lib/env";

type DailyState = {
  xp: number;
  level: number;
  streak: number;
  lastCheckIn?: string; // ISO date (yyyy-mm-dd)
  /**
   * Explicit list of check-in dates (ISO yyyy-mm-dd).
   * Used to render the weekly strip/list reliably.
   */
  checkedDates?: string[];
  canCheckIn: boolean;
  penaltyAppliedDays?: number;
  loading: boolean;
  checkingIn: boolean;
  error?: string;
  lastTxHash?: `0x${string}`;
  source: "onchain" | "local";
};

const XP_PER_CHECKIN_MIN = 6;
const XP_PER_CHECKIN_MAX = 12;
const XP_PENALTY_PER_MISSED_DAY = 8;

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysDiff(aISO: string, bISO: string) {
  const a = new Date(`${aISO}T00:00:00`);
  const b = new Date(`${bISO}T00:00:00`);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function computeLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function key(addr: string) {
  return `arcdeck:daily:${addr.toLowerCase()}`;
}

function uniqPush(list: string[] | undefined, iso: string) {
  const out = Array.isArray(list) ? [...list] : [];
  if (!out.includes(iso)) out.push(iso);
  // keep it bounded (last ~140 entries)
  if (out.length > 140) out.splice(0, out.length - 140);
  return out;
}

// viem/wagmi can infer `unknown` when functionName/abi are dynamic.
// Normalize the result to bigint safely.
function toBigInt(raw: unknown): bigint {
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number") return BigInt(Math.trunc(raw));
  if (typeof raw === "string") return BigInt(raw);
  return BigInt((raw as any) ?? 0);
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

const LAST_CHECKIN_READ_CANDIDATES = ["lastCheckIn", "lastCheckin", "lastCheckInAt"] as const;
const XP_READ_CANDIDATES = ["xp", "points", "score"] as const;
const STREAK_READ_CANDIDATES = ["streak", "combo", "days"] as const;

export function useDailyCheckin() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = React.useState<DailyState>({
    xp: 0,
    level: 1,
    streak: 0,
    checkedDates: [],
    canCheckIn: false,
    loading: false,
    checkingIn: false,
    source: "local",
  });

  // Load + apply penalties (local) whenever address changes
  React.useEffect(() => {
    const addr = address && isAddress(address) ? (getAddress(address) as `0x${string}`) : undefined;

    if (!addr) {
      setState((p) => ({
        ...p,
        xp: 0,
        level: 1,
        streak: 0,
        lastCheckIn: undefined,
        checkedDates: [],
        canCheckIn: false,
        loading: false,
        checkingIn: false,
        error: undefined,
        lastTxHash: undefined,
        source: "local",
        penaltyAppliedDays: undefined,
      }));
      return;
    }

    let data: Partial<DailyState> = {};
    try {
      const raw = window.localStorage.getItem(key(addr));
      data = raw ? (JSON.parse(raw) as Partial<DailyState>) : {};
    } catch {}

    const last = typeof data.lastCheckIn === "string" ? data.lastCheckIn : undefined;
    let xp = typeof data.xp === "number" ? data.xp : 0;
    let streak = typeof data.streak === "number" ? data.streak : 0;
    let checkedDates = Array.isArray(data.checkedDates) ? data.checkedDates.filter((v) => typeof v === "string") : [];

    const today = todayISO();
    let penaltyDays = 0;

    if (last) {
      const diff = daysDiff(last, today);
      if (diff > 1) {
        penaltyDays = diff - 1;
        xp = Math.max(0, xp - penaltyDays * XP_PENALTY_PER_MISSED_DAY);
        streak = 0; // missed at least one day resets streak
      }
    }

    const level = computeLevel(xp);
    const canCheckIn = last !== today;

    const next: DailyState = {
      xp,
      level,
      streak,
      lastCheckIn: last,
      checkedDates,
      canCheckIn,
      loading: false,
      checkingIn: false,
      source: "local",
      penaltyAppliedDays: penaltyDays || undefined,
      error: undefined,
      lastTxHash: undefined,
    };

    try {
      window.localStorage.setItem(key(addr), JSON.stringify(next));
    } catch {}
    setState(next);
  }, [address]);

  // Best-effort on-chain reads (won't break UI if ABI doesn't match)
  React.useEffect(() => {
    if (!publicClient) return;

    const addr = address && isAddress(address) ? (getAddress(address) as `0x${string}`) : undefined;
    if (!addr) return;

    let cancelled = false;

    const run = async () => {
      setState((p) => ({ ...p, loading: true, error: undefined }));

      try {
        // Read last check-in timestamp (seconds)
        let lastCheckTs: number | undefined;
        for (const fn of LAST_CHECKIN_READ_CANDIDATES) {
          try {
            const raw = await publicClient.readContract({
              address: env.DAILY_CONTRACT as `0x${string}`,
              abi: makeReadAbi(fn),
              functionName: fn,
              args: [addr],
            } as any);

            const v = toBigInt(raw);
            const ts = Number(v);
            if (ts > 0 && Number.isFinite(ts)) {
              lastCheckTs = ts;
              break;
            }
          } catch {}
        }

        // Read XP
        let xp: number | undefined;
        for (const fn of XP_READ_CANDIDATES) {
          try {
            const raw = await publicClient.readContract({
              address: env.DAILY_CONTRACT as `0x${string}`,
              abi: makeReadAbi(fn),
              functionName: fn,
              args: [addr],
            } as any);

            const v = toBigInt(raw);
            const n = Number(v);
            if (Number.isFinite(n)) {
              xp = n;
              break;
            }
          } catch {}
        }

        // Read streak
        let streak: number | undefined;
        for (const fn of STREAK_READ_CANDIDATES) {
          try {
            const raw = await publicClient.readContract({
              address: env.DAILY_CONTRACT as `0x${string}`,
              abi: makeReadAbi(fn),
              functionName: fn,
              args: [addr],
            } as any);

            const v = toBigInt(raw);
            const n = Number(v);
            if (Number.isFinite(n)) {
              streak = n;
              break;
            }
          } catch {}
        }

        if (cancelled) return;

        // If we could read at least one field, treat as on-chain source.
        if (lastCheckTs || xp !== undefined || streak !== undefined) {
          const lastIso = lastCheckTs ? new Date(lastCheckTs * 1000).toISOString().slice(0, 10) : undefined;
          const today = todayISO();
          const canCheckIn = lastIso !== today;

          setState((p) => {
            const xpVal = xp ?? p.xp;
            const level = computeLevel(xpVal);

            return {
              ...p,
              loading: false,
              source: "onchain",
              xp: xpVal,
              level,
              streak: streak ?? p.streak,
              lastCheckIn: lastIso ?? p.lastCheckIn,
              checkedDates: lastIso ? uniqPush(p.checkedDates, lastIso) : p.checkedDates,
              canCheckIn,
            };
          });
        } else {
          setState((p) => ({ ...p, loading: false }));
        }
      } catch (e: any) {
        if (cancelled) return;
        setState((p) => ({ ...p, loading: false, error: e?.message || "Failed to read daily state" }));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address]);

  const checkIn = React.useCallback(async () => {
    const addr = address && isAddress(address) ? (getAddress(address) as `0x${string}`) : undefined;
    if (!addr) throw new Error("Connect a wallet");

    const today = todayISO();

    // guard using latest state
    if (!state.canCheckIn) throw new Error("You have already checked in today");

    setState((p) => ({ ...p, checkingIn: true, error: undefined, lastTxHash: undefined }));

    // If on-chain works, prefer it
    if (publicClient) {
      let lastErr: any;

      const tryReadOnchainXp = async (): Promise<number | undefined> => {
        for (const fn of XP_READ_CANDIDATES) {
          try {
            const raw = await publicClient.readContract({
              address: env.DAILY_CONTRACT as `0x${string}`,
              abi: makeReadAbi(fn),
              functionName: fn,
              args: [addr],
            } as any);

            const v = toBigInt(raw);
            const n = Number(v);
            if (Number.isFinite(n)) return n;
          } catch {}
        }
        return undefined;
      };

      for (const fn of DAILY_WRITE_CANDIDATES) {
        try {
          await publicClient.simulateContract({
            address: env.DAILY_CONTRACT as `0x${string}`,
            abi: makeWriteAbi(fn),
            functionName: fn,
            account: addr,
          } as any);

          const hash = (await writeContractAsync({
            address: env.DAILY_CONTRACT as `0x${string}`,
            abi: makeWriteAbi(fn),
            functionName: fn,
          } as any)) as `0x${string}`;

          // Wait for confirmation (best-effort)
          try {
            await publicClient.waitForTransactionReceipt({ hash });
          } catch {}

          // XP: try read from chain; otherwise optimistic gain
          let onchainXp: number | undefined;
          try {
            onchainXp = await tryReadOnchainXp();
          } catch {}

          const optimisticGain = randInt(XP_PER_CHECKIN_MIN, XP_PER_CHECKIN_MAX);

          setState((p) => {
            const prevLast = p.lastCheckIn;

            let nextStreak = p.streak;
            if (prevLast) {
              const diff = daysDiff(prevLast, today);
              nextStreak = diff === 1 ? Math.max(1, p.streak + 1) : 1;
            } else {
              nextStreak = 1;
            }

            const nextXp =
              typeof onchainXp === "number" && Number.isFinite(onchainXp)
                ? onchainXp
                : Math.max(0, p.xp + optimisticGain);

            const next: DailyState = {
              ...p,
              checkingIn: false,
              loading: false,
              source: "onchain",
              lastTxHash: hash,
              lastCheckIn: today,
              checkedDates: uniqPush(p.checkedDates, today),
              canCheckIn: false,
              streak: nextStreak,
              xp: nextXp,
              level: computeLevel(nextXp),
              penaltyAppliedDays: undefined,
            };

            try {
              window.localStorage.setItem(key(addr), JSON.stringify(next));
            } catch {}

            return next;
          });

          return hash;
        } catch (e: any) {
          lastErr = e;
        }
      }

      // fall through to local if ABI mismatch / tx errors
      lastErr && console.warn("Daily on-chain write failed, falling back to local", lastErr);
    }

    // Local fallback
    const gain = randInt(XP_PER_CHECKIN_MIN, XP_PER_CHECKIN_MAX);

    setState((p) => {
      const last = p.lastCheckIn;

      let nextStreak = p.streak;
      if (last) {
        const diff = daysDiff(last, today);
        if (diff === 1) nextStreak += 1;
        else nextStreak = 1;
      } else {
        nextStreak = 1;
      }

      const nextXp = Math.max(0, p.xp + gain);
      const next: DailyState = {
        ...p,
        xp: nextXp,
        level: computeLevel(nextXp),
        streak: nextStreak,
        lastCheckIn: today,
        checkedDates: uniqPush(p.checkedDates, today),
        canCheckIn: false,
        checkingIn: false,
        loading: false,
        source: "local",
        error: undefined,
      };

      try {
        window.localStorage.setItem(key(addr), JSON.stringify(next));
      } catch {}

      return next;
    });

    return undefined;
  }, [address, state.canCheckIn, publicClient, writeContractAsync]);

  // Keep same return pattern your UI expects: spread state + checkIn
  return { ...state, checkIn };
}
