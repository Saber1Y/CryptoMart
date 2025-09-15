const hre = require('hardhat')
const contractAddress = require('./contracts/contractAddress.json')

async function main() {
  console.log('🧪 Testing getMyProducts function...')

  const [deployer] = await hre.ethers.getSigners()
  console.log('Testing with account:', deployer.address)

  // Get the proxy contract
  const CryptoMart = await hre.ethers.getContractFactory('CryptoMart')
  const contract = CryptoMart.attach(contractAddress.CryptoMart)

  try {
    console.log('🔍 Calling getMyProducts...')
    const products = await contract.getMyProducts()
    console.log('✅ getMyProducts succeeded!')
    console.log('Products returned:', products.length)
    console.log('Products:', products)
  } catch (error) {
    console.log('❌ getMyProducts failed:', error.message)
    console.log('Full error:', error)
  }

  try {
    console.log('🔍 Testing getAllCategories...')
    const categories = await contract.getAllCategories()
    console.log('✅ getAllCategories succeeded!')
    console.log('Categories returned:', categories.length)
    console.log('Categories:', categories)
  } catch (error) {
    console.log('❌ getAllCategories failed:', error.message)
  }

  // Test some other basic functions
  try {
    console.log('🔍 Testing contract owner...')
    const owner = await contract.owner()
    console.log('✅ Contract owner:', owner)
  } catch (error) {
    console.log('❌ Getting owner failed:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
