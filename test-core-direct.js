// Test Core contract directly
const hre = require('hardhat')
const contractAddress = require('./contracts/contractAddress.json')

async function testCoreDirectly() {
  console.log('🧪 Testing Core Contract Directly...\n')

  const [owner] = await hre.ethers.getSigners()

  // Get Core contract instance directly
  const CryptoMartCore = await hre.ethers.getContractFactory('CryptoMartCore')
  const coreContract = CryptoMartCore.attach(contractAddress.CryptoMartCore)

  try {
    console.log('Using Core contract address:', contractAddress.CryptoMartCore)
    console.log('Using account:', owner.address)

    // Test getAllCategories on Core directly
    console.log('\n1. Testing getAllCategories on Core directly...')
    try {
      const categories = await coreContract.getAllCategories()
      console.log('✅ Core getAllCategories SUCCESS!')
      console.log('Categories from Core:', categories.length)

      categories.forEach((category, index) => {
        console.log(`Category ${index + 1}:`)
        console.log('  ID:', category.id.toString())
        console.log('  Name:', category.name)
        console.log('  Active:', category.isActive)
      })
    } catch (error) {
      console.log('❌ Core getAllCategories failed:', error.message)
    }

    // Test proxy reference in Core
    console.log('\n2. Testing if proxy can call Core...')
    const ProxyContract = await hre.ethers.getContractFactory('CryptoMart')
    const proxy = ProxyContract.attach(contractAddress.CryptoMart)

    // Check if proxy can see core contract
    try {
      // Let's check the core contract address that the proxy is using
      console.log('Proxy contract address:', contractAddress.CryptoMart)

      // Check if the contract has some basic function
      const owner = await proxy.owner()
      console.log('Proxy owner:', owner)

      // Try direct call to a simple view function first
      console.log('Testing simple view function...')
    } catch (error) {
      console.log('❌ Proxy basic test failed:', error.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCoreDirectly().catch(console.error)
