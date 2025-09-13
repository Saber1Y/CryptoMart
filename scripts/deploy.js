require('dotenv').config()
const { ethers } = require('hardhat')

async function main() {
  console.log('Starting CryptoMart deployment process...')

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

    console.log('Deploying CryptoMart Factory System...')

    // Step 1: Deploy Factory
    const CryptoMartFactory = await ethers.getContractFactory('CryptoMartFactory')
    console.log('1/3 Deploying Factory contract...')
    const factory = await CryptoMartFactory.deploy()
    await factory.waitForDeployment()
    const factoryAddress = await factory.getAddress()
    console.log('✅ Factory deployed to:', factoryAddress)

    // Step 2: Deploy the full system through factory
    console.log('2/3 Deploying CryptoMart system through Factory...')
    const deployTx = await factory.deployFullSystem(5) // 5% service fee
    await deployTx.wait()
    console.log('✅ Full system deployed!')

    // Step 3: Deploy main interface contract
    const CryptoMart = await ethers.getContractFactory('CryptoMart')
    console.log('3/3 Deploying main interface contract...')
    const cryptoMart = await CryptoMart.deploy(factoryAddress)
    await cryptoMart.waitForDeployment()
    const cryptoMartAddress = await cryptoMart.getAddress()
    console.log('✅ Main interface deployed to:', cryptoMartAddress)

    // Get all contract addresses
    const [storageAddr, coreAddr, transactionsAddr] = await factory.getContractAddresses()

    console.log('')
    console.log('🎉 CryptoMart Factory System Deployed Successfully!')
    console.log('================================================')
    console.log('Factory:', factoryAddress)
    console.log('Main Interface (use this):', cryptoMartAddress)
    console.log('Storage:', storageAddr)
    console.log('Core:', coreAddr)
    console.log('Transactions:', transactionsAddr)

    console.log('Waiting for deployment...')
    await cryptoMart.waitForDeployment()

    const mainInterfaceAddress = await cryptoMart.getAddress()
    console.log('✅ Main interface deployed to:', mainInterfaceAddress)

    // Get all contract addresses
    const [storageAddr, coreAddr, transactionsAddr] = await factory.getContractAddresses()

    console.log('')
    console.log('🎉 CryptoMart Factory System Deployed Successfully!')
    console.log('================================================')
    console.log('Factory:', factoryAddress)
    console.log('Main Interface (use this):', mainInterfaceAddress)
    console.log('Storage:', storageAddr)
    console.log('Core:', coreAddr)
    console.log('Transactions:', transactionsAddr)
    console.log('Network:', network.name)
    console.log('Chain ID:', network.chainId)

    // Save the contract address (use main interface address)
    const fs = require('fs')
    const contractsDir = __dirname + '/../contracts'

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir)
    }

    fs.writeFileSync(
      contractsDir + '/contractAddress.json',
      JSON.stringify(
        {
          HemShop: mainInterfaceAddress, // Keep HemShop name for backward compatibility
          CryptoMart: mainInterfaceAddress,
          Factory: factoryAddress,
          Storage: storageAddr,
          Core: coreAddr,
          Transactions: transactionsAddr,
        },
        undefined,
        2
      )
    )

    console.log('Contract address saved to contractAddress.json')
    console.log(`🎉 CryptoMart successfully deployed on ${network.name}!`)
  } catch (error) {
    console.error('Deployment failed!')
    console.error('Error details:', error.message)
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
