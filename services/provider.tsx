'use client'

import * as React from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { RainbowKitProvider, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit'
import { metaMaskWallet, coinbaseWallet, rainbowWallet } from '@rainbow-me/rainbowkit/wallets'
import { sepolia, hardhat, localhost, baseSepolia } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'

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
  [anvilNetwork, baseSepolia, hardhat, localhost, sepolia], // Anvil first for local development
  [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID as string }), publicProvider()],
  {
    // Reduce polling interval to minimize WebSocket connections
    pollingInterval: 30000, // 30 seconds instead of default
  }
)

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

// Only include WalletConnect-dependent wallets if we have a valid project ID
const walletConnectWallets = projectId && projectId !== 'your_project_id_here' && projectId !== 'placeholder'
  ? [
      metaMaskWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'CryptoMart', chains }),
      rainbowWallet({ projectId, chains }),
    ]
  : [
      metaMaskWallet({ projectId: 'fallback', chains }),
    ]

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: walletConnectWallets,
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

  // Suppress WalletConnect JWT warnings in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args) => {
        if (args[0]?.toString().includes('JWT validation error')) {
          return // Suppress JWT validation errors in development
        }
        originalError.apply(console, args)
      }
    }
  }, [])

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider theme={darkTheme()} chains={chains} appInfo={demoAppInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
