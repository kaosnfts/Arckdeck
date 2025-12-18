const DEFAULT_ARC_CHAIN_ID = 5042002;
const DEFAULT_ARC_CHAIN_NAME = "Arc Testnet";
const DEFAULT_ARC_RPC_URL = "https://rpc.testnet.arc.network";
const DEFAULT_ARC_EXPLORER_URL = "https://testnet.arcscan.app";
const DEFAULT_ARC_EXPLORER_API = "https://testnet.arcscan.app/api";

// Tokens / contracts (defaults for Arc Testnet)
const DEFAULT_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

// ✅ Your correct Lootbox Faucet contract
const DEFAULT_FAUCET_CONTRACT = "0x8b0e38e1Bc7498B4a7855d27D8FAd4204057a54c" as const;

const DEFAULT_DAILY_CONTRACT = "0xf8e81D47203A594245E36C48e151709F0C19fBe8" as const;

// Known wrong/test addresses that may appear when envs are missing/misconfigured.
const KNOWN_BAD_ADDRESSES = new Set<string>([
  // Common Remix/Hardhat sample address people accidentally deploy with
  "0xd9145cce52d386f254917e481eb44e9943f39138",
]);

function normalizeAddress(input: string | undefined, fallback: `0x${string}`): `0x${string}` {
  const raw = (input ?? "").trim();
  const isHex40 = /^0x[a-fA-F0-9]{40}$/.test(raw);
  if (!isHex40) return fallback;

  const lower = raw.toLowerCase();
  if (KNOWN_BAD_ADDRESSES.has(lower)) return fallback;

  return raw as `0x${string}`;
}

export const env = {
  ARC_CHAIN_ID: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? DEFAULT_ARC_CHAIN_ID),
  ARC_CHAIN_NAME: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? DEFAULT_ARC_CHAIN_NAME,
  ARC_RPC_URL: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? DEFAULT_ARC_RPC_URL,
  ARC_EXPLORER_URL: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? DEFAULT_ARC_EXPLORER_URL,
  ARC_EXPLORER_API: process.env.NEXT_PUBLIC_ARC_EXPLORER_API ?? DEFAULT_ARC_EXPLORER_API,

  USDC_ADDRESS: normalizeAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS, DEFAULT_USDC_ADDRESS as `0x${string}`),

  // ⚠️ IMPORTANT: This runs on the client. Only NEXT_PUBLIC_* variables are available in production builds.
  FAUCET_CONTRACT: normalizeAddress(
    process.env.NEXT_PUBLIC_FAUCET_CONTRACT,
    DEFAULT_FAUCET_CONTRACT as `0x${string}`
  ),

  DAILY_CONTRACT: normalizeAddress(process.env.NEXT_PUBLIC_DAILY_CONTRACT, DEFAULT_DAILY_CONTRACT as `0x${string}`),

  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
} as const;
