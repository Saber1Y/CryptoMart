// Quick test for getAllCategories
const hre = require('hardhat')
const contractAddress = require('./contracts/contractAddress.json')

async function testGetAllCategories() {
  console.log('🧪 Testing getAllCategories...\n')

  const [owner] = await hre.ethers.getSigners()

  // Get contract instance
  const CryptoMart = await hre.ethers.getContractFactory('CryptoMart')
  const contract = CryptoMart.attach(contractAddress.CryptoMart)

  try {
    console.log('Using contract address:', contractAddress.CryptoMart)
    console.log('Using account:', owner.address)

    // First create a category
    console.log('\n1. Creating a test category...')
    try {
      await contract.createCategory('Electronics')
      console.log('✅ Category created successfully')
    } catch (e) {
      if (e.message.includes('Category name required')) {
        console.log('⚠️ Category creation failed - name issue')
      } else {
        console.log('⚠️ Category creation failed:', e.message)
      }
    }

    // Test getAllCategories
    console.log('\n2. Testing getAllCategories...')
    const categories = await contract.getAllCategories()
    console.log('✅ getAllCategories SUCCESS!')
    console.log('Categories found:', categories.length)

    categories.forEach((category, index) => {
      console.log(`Category ${index + 1}:`)
      console.log('  ID:', category.id.toString())
      console.log('  Name:', category.name)
      console.log('  Active:', category.isActive)
    })

    // Test ABI compatibility
    console.log('\n3. Testing function signatures...')
    const contractInterface = contract.interface
    const getAllCategoriesFunction = contractInterface.getFunction('getAllCategories')
    console.log('Function signature:', getAllCategoriesFunction.format())
  } catch (error) {
    console.error('❌ Test failed:', error.message)

    // Additional debugging
    console.log('\n🔍 Debugging info:')
    console.log('Error code:', error.code)
    if (error.data) {
      console.log('Error data:', error.data)
    }
  }
}

testGetAllCategories().catch(console.error)
