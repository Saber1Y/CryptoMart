require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: '.env.local' })

const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'

console.log('Environment check:')
console.log(
  'PRIVATE_KEY:',
  PRIVATE_KEY ? 'Found (' + PRIVATE_KEY.substring(0, 6) + '...)' : 'Missing'
)
console.log('RPC_URL:', NEXT_PUBLIC_RPC_URL)

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      allowUnlimitedContractSize: true,
      gas: 'auto',
      blockGasLimit: 12000000,
    },
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: 'auto',
      blockGasLimit: 30000000,
      mining: {
        auto: true,
        interval: 0,
      },
    },
    sepolia: {
      url: NEXT_PUBLIC_RPC_URL,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY.replace('0x', '')}`] : [],
      allowUnlimitedContractSize: true,
      gas: 12000000,
      blockGasLimit: 12000000,
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY.replace('0x', '')}`] : [],
      allowUnlimitedContractSize: true,
      gas: 15000000, // Increased gas limit
      blockGasLimit: 15000000,
      chainId: 84532,
    },
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Lower runs = smaller bytecode, higher gas usage
      },
      viaIR: true, // Enable new code generator via IR to support complex structs
      metadata: {
        bytecodeHash: 'none',
      },
      evmVersion: 'shanghai',
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 100000,
  },
}
