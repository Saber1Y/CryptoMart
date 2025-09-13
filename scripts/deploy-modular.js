const hre = require('hardhat')
const fs = require('fs')

async function main() {
  console.log('Starting CryptoMart Modular System deployment...')

  const signers = await hre.ethers.getSigners()
  console.log('Available signers:', signers.length)
  console.log('Deploying contracts with the account:', signers[0].address)

  const network = await hre.ethers.provider.getNetwork()
  console.log('Deploying to network:', network.name, 'Chain ID:', network.chainId)

  const balance = await hre.ethers.provider.getBalance(signers[0].address)
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH')
  console.log()

  try {
    console.log('🏗️  MODULAR DEPLOYMENT PROCESS')
    console.log('=====================================')
    console.log('Deploying contracts separately to avoid size limits.')
    console.log('Benefits: Smaller contracts, better gas efficiency, modular upgrades.')
    console.log()

    const servicePct = 5 // 5% service fee

    // Step 1: Deploy Storage Contract
    console.log('📦 Step 1/5: Deploying Storage contract...')
    const CryptoMartStorage = await hre.ethers.getContractFactory('CryptoMartStorage')
    const storage = await CryptoMartStorage.deploy(servicePct)
    await storage.waitForDeployment()
    const storageAddress = await storage.getAddress()
    console.log('✅ Storage deployed to:', storageAddress)

    // Step 2: Deploy Core Contract
    console.log('🏪 Step 2/5: Deploying Core contract...')
    const CryptoMartCore = await hre.ethers.getContractFactory('CryptoMartCore')
    const core = await CryptoMartCore.deploy(storageAddress)
    await core.waitForDeployment()
    const coreAddress = await core.getAddress()
    console.log('✅ Core deployed to:', coreAddress)

    // Step 3: Deploy Transactions Contract
    console.log('💳 Step 3/5: Deploying Transactions contract...')
    const CryptoMartTransactions = await hre.ethers.getContractFactory('CryptoMartTransactions')
    const transactions = await CryptoMartTransactions.deploy(storageAddress, coreAddress)
    await transactions.waitForDeployment()
    const transactionsAddress = await transactions.getAddress()
    console.log('✅ Transactions deployed to:', transactionsAddress)

    // Step 4: Deploy Registry Contract
    console.log('📋 Step 4/5: Deploying Registry contract...')
    const CryptoMartRegistry = await hre.ethers.getContractFactory('CryptoMartRegistry')
    const registry = await CryptoMartRegistry.deploy()
    await registry.waitForDeployment()
    const registryAddress = await registry.getAddress()
    console.log('✅ Registry deployed to:', registryAddress)

    // Step 5: Deploy Main Interface (Proxy)
    console.log('🚪 Step 5/5: Deploying Main Interface (Proxy)...')
    const CryptoMart = await hre.ethers.getContractFactory('CryptoMart')
    const proxy = await CryptoMart.deploy(registryAddress)
    await proxy.waitForDeployment()
    const proxyAddress = await proxy.getAddress()
    console.log('✅ Main Interface deployed to:', proxyAddress)

    console.log()
    console.log('🔧 Configuring system...')

    // Configure the registry with all contract addresses
    await registry.configureSystem(storageAddress, coreAddress, transactionsAddress)
    console.log('✅ Registry configured with contract addresses')

    // Setup permissions in Storage contract
    await storage.addAuthorizedContract(coreAddress)
    await storage.addAuthorizedContract(transactionsAddress)
    console.log('✅ Storage permissions configured')

    console.log()
    console.log('🎉 CryptoMart Modular System Deployed Successfully!')
    console.log('================================================')
    console.log()
    console.log('📋 Contract Addresses:')
    console.log('Storage:      ', storageAddress)
    console.log('Core:         ', coreAddress)
    console.log('Transactions: ', transactionsAddress)
    console.log('Registry:     ', registryAddress)
    console.log('Main Interface:', proxyAddress)
    console.log()
    console.log('🌐 Frontend Integration:')
    console.log('Use Main Interface address:', proxyAddress)
    console.log(
      'Use Main Interface ABI from: artifacts/contracts/CryptoMartProxy.sol/CryptoMart.json'
    )

    // Save contract addresses for frontend
    const addresses = {
      CryptoMartStorage: storageAddress,
      CryptoMartCore: coreAddress,
      CryptoMartTransactions: transactionsAddress,
      CryptoMartRegistry: registryAddress,
      CryptoMart: proxyAddress, // Main interface for frontend
      // Legacy compatibility
      HemShop: proxyAddress,
    }

    // Write to contract address file
    fs.writeFileSync('./contracts/contractAddress.json', JSON.stringify(addresses, null, 2))

    console.log()
    console.log('📁 Contract addresses saved to: contracts/contractAddress.json')
    console.log(`🎉 CryptoMart successfully deployed on ${network.name}!`)

    return addresses
  } catch (error) {
    console.log()
    console.log('❌ Deployment failed!')
    console.log('=====================')
    console.log('Error details:', error.message)
    console.log()
    console.log('💡 Troubleshooting tips:')
    console.log('1. Make sure you have enough ETH for gas fees')
    console.log('2. Check that all contracts compile successfully')
    console.log('3. Try deploying to a local network first (anvil/hardhat)')
    console.log('4. Verify network configuration in hardhat.config.js')

    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
