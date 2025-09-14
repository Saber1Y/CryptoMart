// Check if contracts are actually deployed
const { ethers } = require('hardhat')
const contractAddresses = require('./contracts/contractAddress.json')

async function checkDeployment() {
  console.log('🔍 Checking Contract Deployment...\n')

  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')

    console.log('Checking bytecode at deployed addresses:\n')

    for (const [contractName, address] of Object.entries(contractAddresses)) {
      console.log(`📋 ${contractName}: ${address}`)

      try {
        const code = await provider.getCode(address)
        if (code === '0x') {
          console.log('❌ No bytecode found - contract not deployed!\n')
        } else {
          console.log(`✅ Bytecode found (${code.length} characters)\n`)
        }
      } catch (e) {
        console.log(`❌ Error checking bytecode: ${e.message}\n`)
      }
    }

    // Also check network
    const network = await provider.getNetwork()
    console.log('Connected to network:', network.name)
    console.log('Chain ID:', network.chainId)

    // Check if Anvil is running
    try {
      const blockNumber = await provider.getBlockNumber()
      console.log('Current block number:', blockNumber)
    } catch (e) {
      console.log('❌ Cannot connect to network:', e.message)
    }
  } catch (error) {
    console.error('Check failed:', error.message)
  }
}

checkDeployment().catch(console.error)
