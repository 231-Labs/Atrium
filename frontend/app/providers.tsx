"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useState, useEffect } from "react";
import { retroWhiteTheme } from "@/config/walletTheme";
import { KioskClientProvider } from "@/components/providers/KioskClientProvider";
import "@mysten/dapp-kit/dist/index.css";

// Load debug tools in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/utils/contentDebug');
}

const networks = {
  testnet: {
    url: getFullnodeUrl('testnet'),
    websocketUrl: 'wss://fullnode.testnet.sui.io:443',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider theme={retroWhiteTheme}>
          <KioskClientProvider networkName="testnet">
            {children}
          </KioskClientProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

