require('dotenv').config()
const { ethers } = require('hardhat')

async function main() {
  console.log('Starting CryptoMart Factory System deployment...')

  try {
    // Get signers and verify we have one
    const signers = await ethers.getSigners()
    console.log('Available signers:', signers.length)

    if (signers.length === 0) {
      throw new Error('No signers available. Check your private key configuration.')
    }

    const deployer = signers[0]
    console.log('Deploying contracts with the account:', deployer.address)

    const network = await ethers.provider.getNetwork()
    console.log('Deploying to network:', network.name, 'Chain ID:', network.chainId)

    const balance = await ethers.provider.getBalance(deployer.address)
    console.log('Account balance:', ethers.formatEther(balance), 'ETH')

    if (balance === 0n) {
      throw new Error('Deployer account has no ETH. Please fund your account with testnet ETH.')
    }

    console.log('')
    console.log('🏭 FACTORY PATTERN DEPLOYMENT PROCESS')
    console.log('=====================================')
    console.log('This will deploy multiple smaller contracts instead of one large contract.')
    console.log('Benefits: Reduced gas costs, modular upgrades, better organization.')
    console.log('')

    // Step 1: Deploy Factory
    const CryptoMartFactory = await ethers.getContractFactory('CryptoMartFactory')
    console.log('📦 Step 1/3: Deploying Factory contract...')

    const factory = await CryptoMartFactory.deploy()
    await factory.waitForDeployment()
    const factoryAddress = await factory.getAddress()
    console.log('✅ Factory deployed to:', factoryAddress)

    // Step 2: Deploy the full system through factory
    console.log('')
    console.log('🔧 Step 2/3: Deploying CryptoMart system through Factory...')
    console.log('   This will deploy: Storage + Core + Transactions contracts')

    const deployTx = await factory.deployFullSystem(5) // 5% service fee
    await deployTx.wait()
    console.log('✅ Full system deployed successfully!')

    // Get the addresses of deployed contracts
    const [storageAddr, coreAddr, transactionsAddr] = await factory.getContractAddresses()

    // Step 3: Deploy main interface contract (the one frontend will use)
    console.log('')
    console.log('🌐 Step 3/3: Deploying main interface contract...')
    console.log('   This provides a unified interface for all functionality')

    const CryptoMart = await ethers.getContractFactory('CryptoMart')
    const cryptoMart = await CryptoMart.deploy(factoryAddress)
    await cryptoMart.waitForDeployment()
    const mainInterfaceAddress = await cryptoMart.getAddress()

    console.log('✅ Main interface deployed to:', mainInterfaceAddress)

    // Display final results
    console.log('')
    console.log('🎉 CryptoMart Factory System Deployed Successfully!')
    console.log('====================================================')
    console.log('')
    console.log('📋 CONTRACT ADDRESSES:')
    console.log('----------------------')
    console.log('🏭 Factory:           ', factoryAddress)
    console.log('🌐 Main Interface:    ', mainInterfaceAddress, '← Use this address in frontend')
    console.log('💾 Storage:           ', storageAddr)
    console.log('⚙️  Core Logic:        ', coreAddr)
    console.log('💰 Transactions:      ', transactionsAddr)
    console.log('')
    console.log('🌍 Network Info:')
    console.log('----------------')
    console.log('Network:', network.name)
    console.log('Chain ID:', network.chainId.toString())
    console.log('')
    console.log('📝 IMPORTANT NOTES:')
    console.log('-------------------')
    console.log('• Use the "Main Interface" address in your frontend')
    console.log('• The factory pattern allows for future upgrades')
    console.log('• Each contract is smaller and more gas-efficient')
    console.log('• Service fee is set to 5%')

    // Save the contract addresses
    const fs = require('fs')
    const contractsDir = __dirname + '/../contracts'

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir)
    }

    const contractAddresses = {
      // For backward compatibility with existing frontend
      HemShop: mainInterfaceAddress,
      CryptoMart: mainInterfaceAddress,

      // Factory system addresses
      Factory: factoryAddress,
      Storage: storageAddr,
      Core: coreAddr,
      Transactions: transactionsAddr,

      // Deployment metadata
      network: network.name,
      chainId: network.chainId.toString(),
      deployedAt: new Date().toISOString(),
      pattern: 'factory',
    }

    fs.writeFileSync(
      contractsDir + '/contractAddress.json',
      JSON.stringify(contractAddresses, undefined, 2)
    )

    console.log('')
    console.log('📁 Contract addresses saved to contractAddress.json')
    console.log('🚀 Deployment completed successfully!')

    // Display system stats
    try {
      const stats = await factory.getSystemStats()
      console.log('')
      console.log('📊 INITIAL SYSTEM STATS:')
      console.log('------------------------')
      console.log('Products:', stats[0].toString())
      console.log('Sales:', stats[1].toString())
      console.log('Categories:', stats[2].toString())
      console.log('Service Fee:', stats[3].toString() + '%')
    } catch (error) {
      console.log('Note: Could not retrieve system stats (normal for fresh deployment)')
    }
  } catch (error) {
    console.error('')
    console.error('❌ Deployment failed!')
    console.error('=====================')
    console.error('Error details:', error.message)
    console.error('')

    if (error.message.includes('gas')) {
      console.error('💡 Gas-related error suggestions:')
      console.error('   • Try deploying to a testnet with higher gas limits')
      console.error('   • Check if you have enough ETH for gas fees')
      console.error('   • The factory pattern should use much less gas than monolithic contracts')
    }

    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
