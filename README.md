# ArcDeck

ArcDeck is a clean, modern hub for **Arc Testnet**.

Features:

- Connect wallet (RainbowKit + wagmi/viem)
- Add / switch network to Arc Testnet
- Wallet analytics (tx count, unique dApps, days since first interaction)
- Balances: native "USDC for gas" + **USDC ERC-20**
- Live header metrics: gwei, current block, avg fee (estimate), approx TPS
- Daily check-in with XP/level progression and missed-day penalties
- USDC lootbox faucet (claim once per 24 hours)

The UI intentionally does not display contract addresses.

## Requirements

- Node.js 18+ (recommended 20)
- npm

## Setup (step-by-step)

1) Open a terminal inside the project folder:

```bash
cd ArcDeck
```

2) Install dependencies:

```bash
npm install
```

3) Create your environment file:

```bash
cp .env.example .env.local
```

4) (Optional) Add a WalletConnect project ID:

```txt
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

5) Run in development:

```bash
npm run dev
```

Open http://localhost:3000

## Troubleshooting

### "Can't resolve @rainbow-me/rainbowkit/styles.css"

This usually happens when you run Next.js from the wrong folder/workspace root.

- Make sure you are inside the folder that contains this project's package.json.
- Run `npm install` inside that folder.

If you have extra lockfiles (package-lock.json) in parent directories, Next may warn about workspace root inference.

## Notes

Faucet and Daily use a best-effort method-name detection. If your contracts use different function names, update the candidates list in `lib/abis.ts`.
