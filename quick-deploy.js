const hre = require('hardhat')

async function quickDeploy() {
  console.log('🚀 Quick deployment test...')

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log('Deployer:', deployer.address)

    // Just deploy the storage contract first to test
    console.log('Deploying Storage...')
    const CryptoMartStorage = await hre.ethers.getContractFactory('CryptoMartStorage')
    const storage = await CryptoMartStorage.deploy(5)
    await storage.waitForDeployment()

    const address = await storage.getAddress()
    console.log('✅ Storage deployed to:', address)

    // Test a simple function call
    const owner = await storage.owner()
    console.log('Storage owner:', owner)

    console.log('🎉 Quick test successful!')
  } catch (error) {
    console.error('❌ Quick deploy failed:', error.message)
  }
}

quickDeploy().catch(console.error)
