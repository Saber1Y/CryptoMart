const hre = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Starting modular CryptoMart deployment...')

  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  )

  // Deploy Storage Contract
  console.log('\n📦 Deploying CryptoMartStorage...')
  const CryptoMartStorage = await hre.ethers.getContractFactory('CryptoMartStorage')
  const storage = await CryptoMartStorage.deploy(300) // 3% service fee
  await storage.waitForDeployment()
  const storageAddress = await storage.getAddress()
  console.log('✅ CryptoMartStorage deployed to:', storageAddress)

  // Deploy Core Contract
  console.log('\n🏗️ Deploying CryptoMartCore...')
  const CryptoMartCore = await hre.ethers.getContractFactory('CryptoMartCore')
  const core = await CryptoMartCore.deploy(storageAddress)
  await core.waitForDeployment()
  const coreAddress = await core.getAddress()
  console.log('✅ CryptoMartCore deployed to:', coreAddress)

  // Deploy Transactions Contract
  console.log('\n💳 Deploying CryptoMartTransactions...')
  const CryptoMartTransactions = await hre.ethers.getContractFactory('CryptoMartTransactions')
  const transactions = await CryptoMartTransactions.deploy(storageAddress, coreAddress)
  await transactions.waitForDeployment()
  const transactionsAddress = await transactions.getAddress()
  console.log('✅ CryptoMartTransactions deployed to:', transactionsAddress)

  // Deploy Registry Contract
  console.log('\n📋 Deploying CryptoMartRegistry...')
  const CryptoMartRegistry = await hre.ethers.getContractFactory('CryptoMartRegistry')
  const registry = await CryptoMartRegistry.deploy()
  await registry.waitForDeployment()
  const registryAddress = await registry.getAddress()
  console.log('✅ CryptoMartRegistry deployed to:', registryAddress)

  // Deploy Proxy Contract
  console.log('\n🔗 Deploying CryptoMartProxy...')
  const CryptoMartProxy = await hre.ethers.getContractFactory('CryptoMart')
  const proxy = await CryptoMartProxy.deploy(registryAddress)
  await proxy.waitForDeployment()
  const proxyAddress = await proxy.getAddress()
  console.log('✅ CryptoMartProxy deployed to:', proxyAddress)

  // Configure contracts
  console.log('\n⚙️ Configuring contracts...')

  // Configure the registry with contract addresses
  console.log('Configuring registry system...')
  await registry.configureSystem(storageAddress, coreAddress, transactionsAddress)

  // Add proxy and core as authorized contracts in storage
  console.log('Authorizing proxy in storage...')
  await storage.addAuthorizedContract(proxyAddress)
  console.log('Authorizing core in storage...')
  await storage.addAuthorizedContract(coreAddress)
  console.log('Authorizing transactions in storage...')
  await storage.addAuthorizedContract(transactionsAddress)

  // Refresh proxy contract references
  console.log('Refreshing proxy contract references...')
  await proxy.refreshContractReferences()

  // Create initial categories
  console.log('\n📂 Creating initial categories...')
  try {
    await proxy.createCategory('Electronics')
    await proxy.createCategory('Fashion')
    await proxy.createCategory('Home & Garden')
    console.log('✅ Initial categories created')
  } catch (error) {
    console.log('⚠️ Categories might already exist or error occurred:', error.message)
  }

  // Save contract addresses
  const contractAddresses = {
    CryptoMartStorage: storageAddress,
    CryptoMartCore: coreAddress,
    CryptoMartTransactions: transactionsAddress,
    CryptoMartRegistry: registryAddress,
    CryptoMart: proxyAddress, // Main contract address for frontend
    HemShop: proxyAddress, // Legacy compatibility
  }

  const addressPath = path.join(__dirname, '../contracts/contractAddress.json')
  fs.writeFileSync(addressPath, JSON.stringify(contractAddresses, null, 2))

  console.log('\n✅ Deployment completed successfully!')
  console.log('📄 Contract addresses saved to:', addressPath)
  console.log('\n📊 Contract Summary:')
  console.log('├── CryptoMartStorage:', storageAddress)
  console.log('├── CryptoMartCore:', coreAddress)
  console.log('├── CryptoMartTransactions:', transactionsAddress)
  console.log('├── CryptoMartRegistry:', registryAddress)
  console.log('└── CryptoMartProxy (Main):', proxyAddress)

  // Verification
  console.log('\n🔍 Verifying deployment...')
  try {
    const categories = await proxy.getAllCategories()
    console.log('✅ Categories loaded:', categories.length)
  } catch (error) {
    console.log('❌ Verification failed:', error.message)
  }

  console.log('\n🎉 Ready to use! Frontend should connect to:', proxyAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
