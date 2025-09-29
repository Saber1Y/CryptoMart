import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// import { mainnet } from "@reown/appkit/networks";

// Custom networks
const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon-explorer.somnia.network/',
    },
    alternative: {
      name: 'SocialScan',
      url: 'https://somnia-testnet.socialscan.io/',
    },
  },
  testnet: true,
}

const somniaMainnet = {
  id: 5031,
  name: 'Somnia Mainnet',
  network: 'somnia-mainnet',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
  testnet: false,
}

const anvil = {
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Anvil Explorer', url: '' },
  },
  testnet: true,
}

// Note: we define customRpcUrls as url field (not “http”) to match docs
export const customRpcUrls = {
  'eip155:50312': [{ url: 'https://dream-rpc.somnia.network/' }],
  'eip155:31337': [{ url: 'http://127.0.0.1:8545' }],
}

// Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [somniaMainnet, somniaTestnet, anvil]

// Create the WagmiAdapter with customRpcUrls
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  customRpcUrls,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
