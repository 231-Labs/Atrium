"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DAppKitProvider, createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { useState } from "react";
import { KioskClientProvider } from "@/components/providers/KioskClientProvider";

// Load debug tools in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/utils/contentDebug');
}

/**
 * Legacy JSON-RPC client kept around for the few APIs that gRPC v2 doesn't
 * cover yet (notably `queryEvents`). Lazily initialized to avoid SSR issues
 * with window access in the SDK constructor.
 */
let _jsonRpcFallbackClient: SuiJsonRpcClient | null = null;

export function getJsonRpcFallbackClient(): SuiJsonRpcClient {
  if (!_jsonRpcFallbackClient) {
    _jsonRpcFallbackClient = new SuiJsonRpcClient({
      network: 'testnet',
      url: 'https://fullnode.testnet.sui.io:443',
    });
  }
  return _jsonRpcFallbackClient;
}

type DAppKitInstance = ReturnType<typeof createDAppKit>;

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: DAppKitInstance;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [dAppKit] = useState(() => createDAppKit({
    networks: ['testnet'],
    defaultNetwork: 'testnet',
    createClient: (network) =>
      new SuiGrpcClient({
        network,
        baseUrl: 'https://fullnode.testnet.sui.io:443',
      }),
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <KioskClientProvider networkName="testnet">
          {children}
        </KioskClientProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
