const hre = require('hardhat')
const fs = require('fs')

async function simpleDeploy() {
  console.log('🚀 Simple CryptoMart Deployment...')

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log('Deploying with:', deployer.address)

    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log('Balance:', hre.ethers.formatEther(balance), 'ETH')

    // 1. Deploy Storage
    console.log('\n1. Deploying Storage...')
    const Storage = await hre.ethers.getContractFactory('CryptoMartStorage')
    const storage = await Storage.deploy(5) // 5% service fee
    await storage.waitForDeployment()
    const storageAddr = await storage.getAddress()
    console.log('✅ Storage:', storageAddr)

    // 2. Deploy Core
    console.log('\n2. Deploying Core...')
    const Core = await hre.ethers.getContractFactory('CryptoMartCore')
    const core = await Core.deploy(storageAddr)
    await core.waitForDeployment()
    const coreAddr = await core.getAddress()
    console.log('✅ Core:', coreAddr)

    // 3. Deploy Transactions
    console.log('\n3. Deploying Transactions...')
    const Transactions = await hre.ethers.getContractFactory('CryptoMartTransactions')
    const transactions = await Transactions.deploy(storageAddr, coreAddr)
    await transactions.waitForDeployment()
    const transactionsAddr = await transactions.getAddress()
    console.log('✅ Transactions:', transactionsAddr)

    // 4. Deploy Registry
    console.log('\n4. Deploying Registry...')
    const Registry = await hre.ethers.getContractFactory('CryptoMartRegistry')
    const registry = await Registry.deploy()
    await registry.waitForDeployment()
    const registryAddr = await registry.getAddress()
    console.log('✅ Registry:', registryAddr)

    // 5. Configure Registry
    console.log('\n5. Configuring Registry...')
    await registry.configureSystem(storageAddr, coreAddr, transactionsAddr)
    console.log('✅ Registry configured')

    // 6. Deploy Proxy
    console.log('\n6. Deploying Proxy...')
    const Proxy = await hre.ethers.getContractFactory('CryptoMart')
    const proxy = await Proxy.deploy(registryAddr)
    await proxy.waitForDeployment()
    const proxyAddr = await proxy.getAddress()
    console.log('✅ Proxy:', proxyAddr)

    // 7. Set Permissions
    console.log('\n7. Setting permissions...')
    await storage.addAuthorizedContract(coreAddr)
    await storage.addAuthorizedContract(transactionsAddr)
    await storage.addAuthorizedContract(proxyAddr)
    console.log('✅ Permissions set')

    // 8. Save addresses
    const addresses = {
      CryptoMartStorage: storageAddr,
      CryptoMartCore: coreAddr,
      CryptoMartTransactions: transactionsAddr,
      CryptoMartRegistry: registryAddr,
      CryptoMart: proxyAddr,
      HemShop: proxyAddr,
    }

    fs.writeFileSync('contracts/contractAddress.json', JSON.stringify(addresses, null, 2))
    console.log('\n✅ Addresses saved to contractAddress.json')

    // 9. Test basic function
    console.log('\n9. Testing deployment...')
    const owner = await proxy.owner()
    console.log('Proxy owner:', owner)

    console.log('\n🎉 Deployment completed successfully!')
    console.log('Main contract address:', proxyAddr)
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    console.error(error.stack)
  }
}

simpleDeploy().catch(console.error)
