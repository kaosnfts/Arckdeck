export const env = {
  ARC_CHAIN_ID: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
  ARC_CHAIN_NAME: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? "Arc Testnet",
  ARC_RPC_URL: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
  ARC_EXPLORER_URL: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app",
  ARC_EXPLORER_API: process.env.NEXT_PUBLIC_ARC_EXPLORER_API ?? "https://testnet.arcscan.app/api",
  USDC_ADDRESS: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000") as `0x${string}`,
  FAUCET_CONTRACT: (process.env.NEXT_PUBLIC_FAUCET_CONTRACT ?? "0x8b0e38e1Bc7498B4a7855d27D8FAd4204057a54c") as `0x${string}`,
  DAILY_CONTRACT: (process.env.NEXT_PUBLIC_DAILY_CONTRACT ?? "0xf8e81D47203A594245E36C48e151709F0C19fBe8") as `0x${string}`,
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
} as const;
