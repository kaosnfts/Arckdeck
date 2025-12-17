"use client";

import "@rainbow-me/rainbowkit/styles.css";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import type { CreateConnectorFn } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "@/lib/arcChain";
import { env } from "@/lib/env";

const queryClient = new QueryClient();

const connectors: CreateConnectorFn[] = (() => {
  const list: CreateConnectorFn[] = [injected({ shimDisconnect: true })];

  if (env.WALLETCONNECT_PROJECT_ID) {
    list.push(
      walletConnect({
        projectId: env.WALLETCONNECT_PROJECT_ID,
        showQrModal: true,
        metadata: {
          name: "ArcDeck",
          description: "ArcDeck — an elegant Arc Testnet hub",
          url: typeof window !== "undefined" ? window.location.origin : "https://localhost",
          icons: ["https://avatars.githubusercontent.com/u/14985020"],
        },
      })
    );
  }

  return list;
})();


export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors,
  transports: {
    [arcTestnet.id]: http(env.ARC_RPC_URL),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            borderRadius: "large",
            overlayBlur: "small",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
