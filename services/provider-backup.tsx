'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiAdapter, projectId, networks as importedNetworks, customRpcUrls } from '@/config'

const queryClient = new QueryClient()

const metadata = {
  name: 'IntentSwap',
  description: 'Swap crypto with just words. AI-powered token transfers on Somnia.',
  url: 'http://localhost:3000/',
  icons: ['https://intentswap.com/logo.svg'],
}

const networks = importedNetworks as [(typeof importedNetworks)[0], ...typeof importedNetworks]

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId ?? '',
  networks,
  defaultNetwork: networks[0],
  metadata,
  customRpcUrls, // pass same override
  features: {
    analytics: true,
  },
  // optionally: allowUnsupportedChain: true
})

interface Props {
  children: ReactNode
  cookies: string | null
}

export default function ContextProvider({ children, cookies }: Props) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={networks}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// export modal if needed
export { modal }
