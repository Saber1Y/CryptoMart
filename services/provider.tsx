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
  [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID as string }), publicProvider()]
)

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'CryptoMart', chains }),
      rainbowWallet({ projectId, chains }),
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
