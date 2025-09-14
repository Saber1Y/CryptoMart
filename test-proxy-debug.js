// Test Core contract directly
const hre = require('hardhat')
const contractAddress = require('./contracts/contractAddress.json')

async function testCoreDirectly() {
  console.log('🧪 Testing Core Contract Directly...\n')

  const [owner] = await hre.ethers.getSigners()

  try {
    // Test Core contract
    const CryptoMartCore = await hre.ethers.getContractFactory('CryptoMartCore')
    const core = CryptoMartCore.attach(contractAddress.CryptoMartCore)

    console.log('Testing Core contract at:', contractAddress.CryptoMartCore)

    // Test a simple function first
    console.log('\n1. Testing Core owner...')
    try {
      const owner = await core.owner()
      console.log('✅ Core owner:', owner)
    } catch (e) {
      console.log('❌ Core owner failed:', e.message)
      return
    }

    // Test getAllCategories on Core
    console.log('\n2. Testing Core getAllCategories...')
    try {
      const categories = await core.getAllCategories()
      console.log('✅ Core getAllCategories SUCCESS!')
      console.log('Categories found:', categories.length)

      categories.forEach((category, index) => {
        console.log(`Category ${index + 1}:`)
        console.log('  ID:', category.id.toString())
        console.log('  Name:', category.name)
        console.log('  Active:', category.isActive)
      })
    } catch (e) {
      console.log('❌ Core getAllCategories failed:', e.message)
    }

    // Test proxy configuration
    console.log('\n3. Testing Proxy configuration...')
    const CryptoMart = await hre.ethers.getContractFactory('CryptoMart')
    const proxy = CryptoMart.attach(contractAddress.CryptoMart)

    try {
      // Test proxy owner
      const proxyOwner = await proxy.owner()
      console.log('✅ Proxy owner:', proxyOwner)

      // Try to refresh contract references
      console.log('Refreshing contract references...')
      await proxy.refreshContractReferences()
      console.log('✅ Contract references refreshed')

      // Now try getAllCategories on proxy
      console.log('Testing proxy getAllCategories after refresh...')
      const proxyCategories = await proxy.getAllCategories()
      console.log('✅ Proxy getAllCategories SUCCESS!')
      console.log('Categories from proxy:', proxyCategories.length)
    } catch (e) {
      console.log('❌ Proxy test failed:', e.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCoreDirectly().catch(console.error)
