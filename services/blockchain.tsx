import { ethers } from 'ethers'
import address from '@/contracts/contractAddress.json'
import abi from '@/artifacts/contracts/CryptoMartProxy.sol/CryptoMart.json'
import {
  ProductStruct,
  PurchaseHistoryStruct,
  ReviewStruct,
  SellerStatus,
  ShippingDetails,
  SubCategoryStruct,
  SellerProfile,
  SellerRegistrationParams,
  CategoryStruct,
  SellerData,
  ProductParams,
} from '@/utils/type.dt'

// Utility functions
export const toWei = (num: number): bigint => {
  try {
    return ethers.parseEther(num.toString())
  } catch (error) {
    throw new Error(`Failed to convert ${num} to Wei: ${error}`)
  }
}

export const fromWei = (num: bigint | string): string => {
  try {
    return ethers.formatEther(num.toString())
  } catch (error) {
    throw new Error(`Failed to convert ${num} from Wei: ${error}`)
  }
}

let ethereum: any
let tx: any

if (typeof window !== 'undefined') ethereum = (window as any).ethereum

export const getEthereumContract = async () => {
  const accounts = await ethereum.request({ method: 'eth_accounts' })

  if (accounts.length > 0) {
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(address.CryptoMart, abi.abi, signer)
    return contract
  } else {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
    const contract = new ethers.Contract(address.CryptoMart, abi.abi, provider)
    return contract
  }
}

// Get read-only contract (no MetaMask interaction)
export const getReadOnlyContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  const contract = new ethers.Contract(address.CryptoMart, abi.abi, provider)
  return contract
}

// Get contract with signer for writing operations when wagmi address is available
export const getEthereumContractWithSigner = async (userAddress: string) => {
  if (!ethereum) {
    throw new Error('Please install a wallet provider')
  }
  console.log('getEthereumContractWithSigner called with userAddress:', userAddress)
  console.log('ethereum object:', ethereum)
  const provider = new ethers.BrowserProvider(ethereum)
  console.log('provider:', provider)
  try {
    const signer = await provider.getSigner(userAddress)
    console.log('signer:', signer)
    const contract = new ethers.Contract(address.CryptoMart, abi.abi, signer)
    console.log('contract:', contract)
    return contract
  } catch (err) {
    console.error('Error getting signer:', err)
    throw err
  }
}

// Product Management Functions
const createProduct = async (params: ProductParams): Promise<void> => {
  if (!ethereum) throw new Error('No wallet provider found')

  try {
    const contract = await getEthereumContract()

    // Our modular contract expects individual parameters
    const tx = await contract.createProduct(
      params.name,
      params.description,
      params.images[0] || '', // Use first image as main image
      Number(params.categoryId),
      toWei(Number(params.price)),
      Number(params.stock)
    )
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const updateProduct = async (product: ProductParams): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()

    // Our modular contract expects individual parameters
    tx = await contract.updateProduct(
      product.id,
      product.name,
      product.description,
      product.images[0] || '', // Use first image as main image
      Number(product.categoryId),
      toWei(Number(product.price)),
      Number(product.stock)
    )
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const deleteProduct = async (productId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.deleteProduct(productId)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getProduct = async (productId: number): Promise<ProductStruct> => {
  const contract = await getEthereumContract()
  const product = await contract.getProduct(productId)
  return structureProduct([product])[0]
}

const getMyProducts = async (): Promise<ProductStruct[]> => {
  try {
    const contract = await getEthereumContract()
    const products = await contract.getMyProducts()
    return structureProduct(products)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getProducts = async (): Promise<ProductStruct[]> => {
  const contract = await getEthereumContract()
  const products = await contract.getAllProducts()

  const orders = await getAllOrders()

  const productRevenue = orders.reduce((acc, order) => {
    acc[order.productId] = (acc[order.productId] || 0) + order.totalAmount
    return acc
  }, {} as { [key: number]: number })

  // Add revenue to each product
  const productsWithRevenue = structureProduct(products).map((product) => ({
    ...product,
    revenue: productRevenue[Number(product.id)] || 0,
  }))

  return productsWithRevenue
}

const getProductsByCategory = async (category: string): Promise<ProductStruct[]> => {
  const contract = getReadOnlyContract()
  const products = await contract.getProductsByCategory(category)
  return structureProduct(products)
}

const getSellerProducts = async (seller: string): Promise<ProductStruct[]> => {
  const contract = getReadOnlyContract()
  const products = await contract.getSellerProducts(seller)
  return structureProduct(products)
}

const getSellerBalance = async (seller: string): Promise<number> => {
  const contract = await getEthereumContract()
  const balance = await contract.getSellerBalance(seller)
  return Number(fromWei(balance))
}

const buyProduct = async (
  productId: number,
  shippingDetails: ShippingDetails,
  selectedColor: string,
  selectedSize: string,
  quantity: number,
  price: number
): Promise<void> => {
  if (!ethereum) throw new Error('No wallet provider found')

  try {
    const contract = await getEthereumContract()

    // Our modular contract only expects productId and value
    // Additional details like shipping, color, size are handled off-chain or in events
    const tx = await contract.buyProduct(productId, {
      value: toWei(price),
    })
    await tx.wait()
  } catch (error) {
    console.error('Buy product error:', error)
    throw error
  }
}

const getSellerPurchaseHistory = async (seller: string): Promise<PurchaseHistoryStruct[]> => {
  const contract = await getEthereumContract()
  const purchaseHistory = await contract.getSellerPurchaseHistory(seller)
  return structurePurchaseHistory(purchaseHistory)
}

const getBuyerPurchaseHistory = async (buyer: string): Promise<PurchaseHistoryStruct[]> => {
  const contract = await getEthereumContract()
  const purchaseHistory = await contract.getBuyerPurchaseHistory(buyer)
  return structurePurchaseHistory(purchaseHistory)
}

const createReview = async (productId: number, rating: number, comment: string): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.createReview(productId, rating, comment)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getReviews = async (productId: number): Promise<ReviewStruct[]> => {
  const contract = await getEthereumContract()
  const reviews = await contract.getReviews(productId)
  return structureReview(reviews)
}
const deleteReview = async (productId: number, reviewId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.deleteReview(productId, reviewId)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const markPurchaseDelivered = async (productId: number, buyer: string): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.markPurchaseDelivered(productId, buyer)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const withdraw = async (): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.withdraw()
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const changeServicePct = async (newPct: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.changeServicePct(newPct)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const createCategory = async (name: string): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.createCategory(name)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const createSubCategory = async (parentId: number, name: string): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.createSubCategory(parentId, name)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getAllCategories = async () => {
  try {
    const contract = await getEthereumContract()
    const categories = await contract.getAllCategories()

    // Our modular contract returns CategoryStruct[] directly
    return categories.map((category: any) => ({
      id: Number(category.id),
      name: category.name,
      isActive: category.isActive,
      subCategoryIds: [], // Simplified - no subcategories in modular version
    }))
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const createSubCategoriesBulk = async (parentId: number, names: string[]): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.createSubCategoriesBulk(parentId, names)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const fetchSubCategories = async (categoryId: number): Promise<SubCategoryStruct[]> => {
  try {
    const contract = await getEthereumContract()
    const subCategories = await contract.getSubCategories(categoryId)
    return subCategories.map((subCategory: any) => ({
      id: Number(subCategory.id),
      name: subCategory.name,
      parentCategoryId: Number(subCategory.parentCategoryId),
      isActive: subCategory.isActive,
    }))
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const updateCategory = async (id: number, name: string, isActive: boolean): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.updateCategory(id, name, isActive)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const updateSubCategory = async (id: number, name: string, isActive: boolean): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.updateSubCategory(id, name, isActive)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getSubCategory = async (id: number): Promise<SubCategoryStruct> => {
  try {
    const contract = await getEthereumContract()
    const [subCatId, name, parentCategoryId, isActive] = await contract.getSubCategory(id)

    return {
      id: Number(subCatId),
      name: name,
      parentCategoryId: Number(parentCategoryId),
      isActive: isActive,
    }
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const deleteCategory = async (id: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.deleteCategory(id)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const deleteSubCategory = async (id: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()
    tx = await contract.deleteSubCategory(id)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getPendingSellers = async (): Promise<string[]> => {
  try {
    const contract = await getEthereumContract()
    const pendingSellers = await contract.getPendingVerificationUsers()
    return pendingSellers
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getSellerStatus = async (seller: string): Promise<SellerStatus> => {
  try {
    const contract = await getEthereumContract()
    return await contract.getSellerStatus(seller)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const requestToBecomeVendor = async (
  params: SellerRegistrationParams,
  userAddress: string
): Promise<void> => {
  try {
    // Get contract with signer (assume wallet is connected and address is valid)
    const contract = await getEthereumContractWithSigner(userAddress)
    const address = userAddress
    console.log('Using wagmi address:', address)

    // Check if user is registered
    try {
      const userData = await contract.getUser(address)
      if (!userData[0] || userData[0] === '') {
        // Empty name means not registered
        console.log('User not registered, registering first...')
        const userTx = await contract.registerUser(
          params.businessName,
          params.email,
          params.logo || ''
        )
        await userTx.wait()
        console.log('User registration completed')
      }
    } catch (error) {
      // If getUser fails, user is not registered, so register them
      console.log('User not found, registering first...')
      const userTx = await contract.registerUser(
        params.businessName,
        params.email,
        params.logo || ''
      )
      await userTx.wait()
      console.log('User registration completed')
    }

    // Now register as seller
    console.log('Registering as seller...')
    const tx = await contract.registerSeller(
      params.businessName,
      params.description,
      params.email,
      params.phone,
      params.logo
    )
    await tx.wait()
    console.log('Seller registration completed!')
  } catch (error) {
    console.log(error)
    reportError(error)
    return Promise.reject(error)
  }
}

const getSellerProfile = async (seller: string): Promise<SellerProfile> => {
  try {
    const contract = await getEthereumContract()
    const profile = await contract.getSellerProfile(seller)
    return {
      businessName: profile.businessName,
      description: profile.description,
      email: profile.email,
      phone: profile.phone,
      logo: profile.logo,
      registeredAt: Number(profile.registeredAt),
      termsAccepted: profile.termsAccepted,
    }
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getCategory = async (id: number): Promise<CategoryStruct> => {
  try {
    const contract = await getEthereumContract()
    const [catId, name, isActive, subCategoryIds] = await contract.getCategory(id)
    return {
      id: Number(catId),
      name,
      isActive,
      subCategoryIds: subCategoryIds.map((id: any) => Number(id)),
    }
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const registerAndVerifyContractOwner = async (): Promise<void> => {
  if (!ethereum) throw new Error('No wallet provider found')

  try {
    const contract = await getEthereumContract()
    const currentAddress = ethereum.selectedAddress

    // Verify caller is contract owner
    const owner = await contract.owner()
    if (owner.toLowerCase() !== currentAddress.toLowerCase()) {
      throw new Error('Only contract owner can perform this action')
    }

    // Register owner as user first if not already registered
    const userData = await contract.getUser(currentAddress)
    if (!userData.isRegistered) {
      const userTx = await contract.registerUser('Contract Owner', 'admin@cryptomart.com', '')
      await userTx.wait()
    }

    // Register owner as seller if not already registered
    const isRegistered = await contract.registeredSellers(currentAddress)
    if (!isRegistered) {
      const sellerTx = await contract.registerSeller(
        'CryptoMart Official Shop',
        'Official CryptoMart store',
        'admin@cryptomart.com',
        '0000000000',
        ''
      )
      await sellerTx.wait()
    }

    // Ensure owner has verified status
    const sellerData = await contract.getSeller(currentAddress)
    if (sellerData.status !== SellerStatus.Verified) {
      const statusTx = await contract.updateSellerStatus(currentAddress, SellerStatus.Verified)
      await statusTx.wait()
    }
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const ensureOwnerHasSellerAccess = async () => {
  try {
    const contract = await getEthereumContract()
    const owner = await contract.owner()
    const currentAddress = ethereum.selectedAddress

    if (currentAddress.toLowerCase() === owner.toLowerCase()) {
      // Register owner as user if not already registered
      const userData = await contract.getUser(currentAddress)
      if (!userData.isRegistered) {
        const userTx = await contract.registerUser('Contract Owner', 'admin@cryptomart.com', '')
        await userTx.wait()
      }

      // Register and verify owner as seller if needed
      const sellerData = await contract.getSeller(currentAddress)
      if (sellerData.status !== SellerStatus.Verified) {
        await contract.grantOwnerSellerAccess()
      }
    }
  } catch (error) {
    console.error('Error ensuring owner access:', error)
  }
}

const getAllSellers = async (): Promise<SellerData[]> => {
  try {
    const contract = await getEthereumContract()
    const addresses = await contract.getAllRegisteredSellers()

    const sellersData = await Promise.all(
      addresses.map(async (address: string) => {
        const sellerData = await contract.getSeller(address)
        return {
          address,
          profile: sellerData.profile,
          status: sellerData.status,
          balance: parseFloat(fromWei(sellerData.balance)),
          productIds: sellerData.productIds.map((id: any) => Number(id)),
        }
      })
    )
    return sellersData
  } catch (error) {
    console.error('Error in getAllSellers:', error)
    throw error
  }
}

const getSeller = async (address: string): Promise<SellerData> => {
  const contract = getReadOnlyContract()
  const sellerData = await contract.getSeller(address)

  return {
    address,
    profile: {
      businessName: sellerData.profile.businessName,
      description: sellerData.profile.description,
      email: sellerData.profile.email,
      phone: sellerData.profile.phone,
      logo: sellerData.profile.logo,
      registeredAt: Number(sellerData.profile.registeredAt),
      termsAccepted: sellerData.profile.termsAccepted,
    },
    status: sellerData.status,
    balance: parseFloat(fromWei(sellerData.balance)),
    productIds: sellerData.productIds.map((id: any) => Number(id)),
  }
}

const isOwnerOrVerifiedSeller = async (): Promise<boolean> => {
  try {
    const contract = await getEthereumContract()
    const currentAddress = ethereum.selectedAddress

    const owner = await contract.owner()
    if (owner.toLowerCase() === currentAddress.toLowerCase()) {
      await ensureOwnerHasSellerAccess()
      return true
    }

    const sellerStatus = await contract.getSellerStatus(currentAddress)
    return sellerStatus === SellerStatus.Verified
  } catch (error) {
    reportError(error)
    return false
  }
}

const updateSellerStatus = async (seller: string, status: SellerStatus): Promise<void> => {
  if (!ethereum) throw new Error('No wallet provider found')

  try {
    const contract = await getEthereumContract()
    const owner = await contract.owner()

    if (owner.toLowerCase() !== ethereum.selectedAddress.toLowerCase()) {
      throw new Error('Only contract owner can update seller status')
    }

    const tx = await contract.updateSellerStatus(seller, status)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const checkSellerVerification = async (
  address: string
): Promise<{
  isVerified: boolean
  status: SellerStatus
}> => {
  try {
    const contract = await getEthereumContract()
    const sellerData = await contract.getSeller(address)

    return {
      isVerified: sellerData.status === SellerStatus.Verified,
      status: sellerData.status,
    }
  } catch (error) {
    console.error('Error checking seller verification:', error)
    return {
      isVerified: false,
      status: SellerStatus.Unverified,
    }
  }
}

const structureProduct = (products: any[]): ProductStruct[] => {
  return products.map((product: any) => ({
    id: Number(product.id),
    seller: product.seller,
    name: product.name,
    description: product.description,
    price: BigInt(product.price),
    stock: Number(product.stock),
    initialStock: Number(product.initialStock || product.stock),
    colors: product.colors,
    sizes: product.sizes,
    images: product.images,
    category: product.category,
    subCategory: product.subCategory,
    weight: Number(product.weight),
    model: product.model,
    brand: product.brand,
    sku: Number(product.sku),
    soldout: product.soldout,
    wishlist: product.wishlist,
    deleted: product.deleted,
    reviews: structureReview(product.reviews),
  }))
}

const structureReview = (reviews: any[]): ReviewStruct[] => {
  return reviews.map((review: any) => ({
    reviewId: Number(review.reviewId),
    reviewer: review.reviewer,
    rating: Number(review.rating),
    comment: review.comment,
    deleted: review.deleted,
    timestamp: Number(review.timestamp),
  }))
}

const safeFromWei = (value: string | number | bigint): string => {
  try {
    // Handle BigInt values
    if (typeof value === 'bigint') {
      return ethers.formatEther(value)
    }
    // Handle string/number values
    return ethers.formatEther(value.toString())
  } catch (error) {
    console.error('Error converting value:', error)
    return '0'
  }
}

const markOrderDelivered = async (productId: number, buyerAddress: string): Promise<void> => {
  if (!ethereum) throw new Error('No wallet provider found')

  try {
    const contract = await getEthereumContract()
    const tx = await contract.markPurchaseDelivered(productId, buyerAddress)
    await tx.wait()
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getAllOrders = async (): Promise<PurchaseHistoryStruct[]> => {
  try {
    const contract = await getEthereumContract()
    const sellers = await contract.getAllRegisteredSellers()
    let allOrders: PurchaseHistoryStruct[] = []

    for (const seller of sellers) {
      const sellerOrders = await contract.getSellerPurchaseHistory(seller)
      allOrders = [...allOrders, ...structurePurchaseHistory(sellerOrders)]
    }

    return allOrders
  } catch (error) {
    reportError(error)
    return []
  }
}

const structurePurchaseHistory = (history: any[]): PurchaseHistoryStruct[] => {
  return history.map((item: any) => ({
    productId: Number(item.productId),
    totalAmount: Number(safeFromWei(item.totalAmount)),
    basePrice: Number(safeFromWei(item.basePrice)),
    timestamp: Number(item.timestamp),
    lastUpdated: Number(item.lastUpdated || item.timestamp),
    buyer: item.buyer,
    seller: item.seller,
    isDelivered: item.isDelivered,
    shippingDetails: item.shippingDetails,
    orderDetails: {
      name: item.orderDetails?.name || item.name || '',
      images: item.orderDetails?.images || item.images || [],
      selectedColor: item.orderDetails?.selectedColor || item.selectedColor || '',
      selectedSize: item.orderDetails?.selectedSize || item.selectedSize || '',
      quantity: Number(item.orderDetails?.quantity) || Number(item.quantity) || 1,
      price: Number(safeFromWei(item.orderDetails?.price || item.price || '0')),
    },
  }))
}

const getServiceFee = async (): Promise<number> => {
  try {
    const contract = await getEthereumContract()
    const fee = await contract.servicePct()
    return Number(fee)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getWalletBalance = async (address: string): Promise<number> => {
  try {
    if (!ethereum) throw new Error('No wallet provider found')

    const provider = new ethers.BrowserProvider(ethereum)
    const balance = await provider.getBalance(address)
    return Number(fromWei(balance))
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getMyProducts,
  getProducts,
  getProductsByCategory,
  getSellerProducts,
  getSellerBalance,
  getSellerPurchaseHistory,
  getBuyerPurchaseHistory,
  getReviews,
  createReview,
  deleteReview,
  updateSellerStatus,
  markPurchaseDelivered,
  withdraw,
  changeServicePct,
  buyProduct,
  createCategory,
  createSubCategory,
  getAllCategories,
  createSubCategoriesBulk,
  fetchSubCategories,
  updateCategory,
  updateSubCategory,
  getSubCategory,
  deleteCategory,
  deleteSubCategory,
  getPendingSellers,
  getSellerStatus,
  requestToBecomeVendor,
  getSellerProfile,
  getCategory,
  registerAndVerifyContractOwner,
  getAllSellers,
  getSeller,
  isOwnerOrVerifiedSeller,
  checkSellerVerification,
  safeFromWei,
  markOrderDelivered,
  getAllOrders,
  type CategoryStruct,
  getServiceFee,
  getWalletBalance,
}
