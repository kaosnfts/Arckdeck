export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

/**
 * IMPORTANT:
 * The ABIs below are "best-effort" defaults because this project is designed to work
 * with faucet/daily contracts that may have different function names.
 *
 * If your contracts use different function names/args, update these candidate lists.
 */
export const FAUCET_WRITE_CANDIDATES = [
  // ArcDeck Lootbox Faucet
  "claimLootbox",
  // Common faucet patterns
  "claim",
  "drip",
  "collect",
  "request",
  "mint",
] as const;

export const DAILY_WRITE_CANDIDATES = ["checkIn", "checkin", "daily", "claim"] as const;
