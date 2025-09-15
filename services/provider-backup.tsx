'use client'

import * as React from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { RainbowKitProvider, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit'
import { metaMaskWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets'
import { sepolia, hardhat, localhost, baseSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'

// Configure Anvil network (same as localhost but with specific config)
const anvilNetwork = {
  ...localhost,
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
}

const { chains, publicClient } = configureChains(
  [anvilNetwork, localhost, hardhat], // Focus on local networks for development
  [publicProvider()] // Use only public provider for simplicity
)

// Use a fallback projectId or make it optional for local development
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'local-development'

const connectors = connectorsForWallets([
  {
    groupName: 'Development',
    wallets: [
      injectedWallet({ chains }), // For MetaMask without WalletConnect
      // Only include WalletConnect-based wallets if we have a valid project ID
      ...(process.env.NEXT_PUBLIC_PROJECT_ID && process.env.NEXT_PUBLIC_PROJECT_ID !== 'local-development' 
        ? [metaMaskWallet({ projectId, chains })] 
        : [])
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

const demoAppInfo = {
  appName: 'CryptoMart - Decentralized E-commerce Platform',
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider theme={darkTheme()} chains={chains} appInfo={demoAppInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
