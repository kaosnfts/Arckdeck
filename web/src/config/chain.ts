export const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: "0x4cef52",
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  faucet: "https://faucet.circle.com/",
  nativeCurrencySymbol: "USDC",
  nativeCurrencyDecimals: 6,
  usdcToken: "0x3600000000000000000000000000000000000000",
  altRpcs: [
    "https://rpc.testnet.arc.network",
    "https://rpc.quicknode.testnet.arc.network",
    "https://rpc.blockdaemon.testnet.arc.network",
  ],
  logScanBlocks: 9000,
} as const;
