import type { Chain } from "viem";
import { env } from "@/lib/env";

export const arcTestnet: Chain = {
  id: env.ARC_CHAIN_ID,
  name: env.ARC_CHAIN_NAME,
  network: "arc-testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [env.ARC_RPC_URL] },
    public: { http: [env.ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: env.ARC_EXPLORER_URL },
  },
};

export const ARC_ADD_NETWORK_PARAMS = {
  chainId: `0x${env.ARC_CHAIN_ID.toString(16)}`,
  chainName: env.ARC_CHAIN_NAME,
  rpcUrls: [env.ARC_RPC_URL],
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  blockExplorerUrls: [env.ARC_EXPLORER_URL],
} as const;
