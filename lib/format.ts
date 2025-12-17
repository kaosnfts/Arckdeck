import { formatUnits } from "viem";

export function shortAddr(addr?: string, chars = 4) {
  if (!addr) return "–";
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function fmtUnits(value?: bigint, decimals = 18, digits = 4) {
  if (value === undefined) return "–";
  const s = formatUnits(value, decimals);
  const [i, f = ""] = s.split(".");
  const trimmed = f.slice(0, digits).replace(/0+$/, "");
  return trimmed.length ? `${i}.${trimmed}` : i;
}

export function fmtNumber(n?: number, digits = 2) {
  if (n === undefined || Number.isNaN(n)) return "–";
  return n.toFixed(digits);
}

export function daysSince(tsSeconds?: number) {
  if (!tsSeconds) return "–";
  const ms = tsSeconds * 1000;
  const d = Math.max(0, Date.now() - ms);
  return Math.floor(d / (1000 * 60 * 60 * 24));
}
