// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import './CryptoMartRegistry.sol';
import './CryptoMartCore.sol';
import './CryptoMartTransactions.sol';
import './CryptoMartStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title CryptoMart
 * @dev Main interface contract that proxies calls to the appropriate sub-contracts
 * This provides a unified interface for the frontend while using the registry pattern internally
 */
contract CryptoMart is Ownable {
  
  CryptoMartRegistry public immutable registry;
  
  // --- Contract References (cached for gas efficiency) ---
  CryptoMartStorage public storageContract;
  CryptoMartCore public coreContract;
  CryptoMartTransactions public transactionsContract;

  // --- Events (re-emitted from sub-contracts for frontend compatibility) ---
  event ProductCreated(uint256 indexed productId, address indexed seller, string name, uint256 cost);
  event ProductUpdated(uint256 indexed productId);
  event ProductDeleted(uint256 indexed productId);
  event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller);
  event UserRegistered(address indexed user, string name);
  event SellerRegistered(address indexed seller, string businessName);
  event CategoryCreated(uint256 indexed categoryId, string name);
  event BalanceWithdrawn(address indexed seller, uint256 amount);
  event ReviewCreated(uint256 indexed productId, address indexed reviewer, uint256 rating);

  constructor(address _registry) {
    registry = CryptoMartRegistry(_registry);
    _transferOwnership(msg.sender);
    // Don't call _updateContractReferences() here as system may not be configured yet
    // Call refreshContractReferences() after system configuration
  }

  /**
   * @dev Update contract references from registry
   * Call this after any contract upgrades
   */
  function _updateContractReferences() internal {
    // Check if registry is configured before trying to get addresses
    if (!registry.isConfigured()) {
      return; // Skip if not configured yet
    }
    
    (address storage_, address core, address transactions) = registry.getContractAddresses();
    
    storageContract = CryptoMartStorage(payable(storage_));
    coreContract = CryptoMartCore(payable(core));
    transactionsContract = CryptoMartTransactions(payable(transactions));
  }

  /**
   * @dev Manually refresh contract references (in case of upgrades)
   */
  function refreshContractReferences() external {
    _updateContractReferences();
  }

  // ===========================================
  // USER FUNCTIONS (delegated to Core contract)
  // ===========================================

  function registerUser(string memory name, string memory email, string memory avatar) external {
    coreContract.registerUser(msg.sender, name, email, avatar);
    emit UserRegistered(msg.sender, name);
  }

  function getUser(address user) external view returns (CryptoMartStorage.UserProfile memory) {
    return coreContract.getUser(user);
  }

  // ===========================================
  // SELLER FUNCTIONS (delegated to Core contract)
  // ===========================================

  function registerSeller(
    string memory businessName,
    string memory description,
    string memory email,
    string memory phone,
    string memory logo
  ) external {
    coreContract.registerSeller(msg.sender, businessName, description, email, phone, logo);
    emit SellerRegistered(msg.sender, businessName);
  }

  function getSeller(address seller) external view returns (
    CryptoMartStorage.SellerProfile memory,
    CryptoMartStorage.SellerStatus
  ) {
    return coreContract.getSeller(seller);
  }

  function getSellerProfile(address seller) external view returns (CryptoMartStorage.SellerProfile memory) {
    return coreContract.getSellerProfile(seller);
  }

  function getAllSellers() external view returns (address[] memory) {
    return coreContract.getAllSellers();
  }

  function getAllRegisteredSellers() external view returns (address[] memory) {
    return coreContract.getAllRegisteredSellers();
  }

  function getPendingVerificationUsers() external view returns (address[] memory) {
    return coreContract.getPendingVerificationUsers();
  }

  function getSellerStatus(address seller) external view returns (CryptoMartStorage.SellerStatus) {
    return coreContract.getSellerStatus(seller);
  }

  // ===========================================
  // CATEGORY FUNCTIONS (delegated to Core contract)
  // ===========================================

  function createCategory(string memory name) external onlyOwner {
    coreContract.createCategory(name);
    emit CategoryCreated(storageContract.categoryCounter(), name);
  }

  function getAllCategories() external view returns (CryptoMartStorage.CategoryStruct[] memory) {
    return coreContract.getAllCategories();
  }

  function getCategory(uint256 id) external view returns (uint256, string memory, bool, uint256[] memory) {
    return coreContract.getCategory(id);
  }

  function updateCategory(uint256 id, string memory name, bool isActive) external {
    coreContract.updateCategory(id, name, isActive);
  }

  function deleteCategory(uint256 id) external {
    coreContract.deleteCategory(id);
  }

  // ===========================================
  // PRODUCT FUNCTIONS (delegated to Core contract)
  // ===========================================

  function createProduct(
    string memory name,
    string memory description,
    string memory image,
    uint256 categoryId,
    uint256 cost,
    uint256 stock
  ) external {
    // Validate seller permissions at proxy level
    require(storageContract.registeredSellers(msg.sender), 'Must be registered seller');
    (, CryptoMartStorage.SellerStatus status) = storageContract.getSeller(msg.sender);
    require(status == CryptoMartStorage.SellerStatus.Verified, 'Must be verified seller');
    
    coreContract.createProduct(msg.sender, name, description, image, categoryId, cost, stock);
    emit ProductCreated(storageContract.totalProducts(), msg.sender, name, cost);
  }

  function getProduct(uint256 productId) external view returns (CryptoMartStorage.ProductStruct memory) {
    return coreContract.getProduct(productId);
  }

  function getAllProducts() external view returns (CryptoMartStorage.ProductStruct[] memory) {
    return coreContract.getAllProducts();
  }

  function getMyProducts() external view returns (CryptoMartStorage.ProductStruct[] memory) {
    return coreContract.getMyProducts();
  }

  function getSellerProducts(address seller) external view returns (CryptoMartStorage.ProductStruct[] memory) {
    return coreContract.getSellerProducts(seller);
  }

  // ===========================================
  // TRANSACTION FUNCTIONS (delegated to Transactions contract)
  // ===========================================

  function buyProduct(uint256 productId) external payable {
    transactionsContract.buyProduct{value: msg.value}(productId);
    // Note: Events are emitted by Transactions contract
  }

  function getBuyerPurchaseHistory(address buyer) external view returns (CryptoMartStorage.PurchaseStruct[] memory) {
    return transactionsContract.getBuyerPurchaseHistory(buyer);
  }

  function getSellerPurchaseHistory(address seller) external view returns (CryptoMartStorage.PurchaseStruct[] memory) {
    return transactionsContract.getSellerPurchaseHistory(seller);
  }

  function markPurchaseDelivered(uint256 productId, address buyer) external {
    transactionsContract.markPurchaseDelivered(productId, buyer);
  }

  function withdraw() external {
    transactionsContract.withdraw();
  }

  function getSellerBalance(address seller) external view returns (uint256) {
    return transactionsContract.getSellerBalance(seller);
  }

  // ===========================================
  // REVIEW FUNCTIONS (delegated to Transactions contract)  
  // ===========================================

  function createReview(uint256 productId, uint256 rating, string memory comment) external {
    transactionsContract.createReview(productId, rating, comment);
  }

  function getReviews(uint256 productId) external view returns (CryptoMartStorage.ReviewStruct[] memory) {
    return transactionsContract.getReviews(productId);
  }

  function deleteReview(uint256 productId, uint256 reviewId) external {
    transactionsContract.deleteReview(productId, reviewId);
  }

  // ===========================================
  // ADMIN FUNCTIONS (delegated to Storage)
  // ===========================================

  function changeServicePct(uint256 newPct) external {
    storageContract.setServicePct(newPct);
  }

  function withdrawServiceFees() external {
    storageContract.withdrawServiceFees();
  }

  // ===========================================
  // COMPATIBILITY FUNCTIONS (for existing frontend)
  // ===========================================

  // These functions maintain compatibility with the existing frontend code
  
  function registeredUsers(address user) external view returns (bool) {
    return storageContract.registeredUsers(user);
  }

  function registeredSellers(address seller) external view returns (bool) {
    return storageContract.registeredSellers(seller);
  }

  function servicePct() external view returns (uint256) {
    return storageContract.servicePct();
  }

  function getTotalProducts() external view returns (uint256) {
    return coreContract.getTotalProducts();
  }

  function getTotalSales() external view returns (uint256) {
    return coreContract.getTotalSales();
  }

  // Stub functions for subcategory compatibility (simplified)
  function createSubCategory(uint256 /*parentId*/, string memory name) external onlyOwner {
    coreContract.createCategory(name);
  }

  function createSubCategoriesBulk(uint256 /*parentId*/, string[] memory names) external onlyOwner {
    for (uint256 i = 0; i < names.length; i++) {
      coreContract.createCategory(names[i]);
    }
  }

  function getSubCategories(uint256 /*categoryId*/) external pure returns (uint256[] memory) {
    return new uint256[](0);
  }

  function updateSubCategory(uint256 id, string memory name, bool isActive) external {
    coreContract.updateCategory(id, name, isActive);
  }

  function getSubCategory(uint256 id) external view returns (uint256, string memory, uint256, bool) {
    (uint256 catId, string memory name, bool isActive, ) = coreContract.getCategory(id);
    return (catId, name, 0, isActive);
  }

  function deleteSubCategory(uint256 id) external {
    coreContract.deleteCategory(id);
  }

  function updateSellerStatus(address seller, CryptoMartStorage.SellerStatus status) external onlyOwner {
    coreContract.updateSellerStatus(seller, status);
  }

  function grantOwnerSellerAccess() external onlyOwner {
    coreContract.grantOwnerSellerAccess();
  }

  // Additional compatibility functions that might be needed
  function updateProduct(
    uint256 productId,
    string memory name,
    string memory description,
    string memory image,
    uint256 categoryId,
    uint256 cost,
    uint256 stock
  ) external {
    coreContract.updateProduct(productId, name, description, image, categoryId, cost, stock);
    emit ProductUpdated(productId);
  }

  function deleteProduct(uint256 productId) external {
    coreContract.deleteProduct(productId);
    emit ProductDeleted(productId);
  }

  function getProductsByCategory(uint256 categoryId) external view returns (CryptoMartStorage.ProductStruct[] memory) {
    // Get all products and filter by category
    CryptoMartStorage.ProductStruct[] memory allProducts = coreContract.getAllProducts();
    
    // Count products in category first
    uint256 count = 0;
    for (uint256 i = 0; i < allProducts.length; i++) {
      if (allProducts[i].categoryId == categoryId) {
        count++;
      }
    }
    
    // Create result array
    CryptoMartStorage.ProductStruct[] memory categoryProducts = new CryptoMartStorage.ProductStruct[](count);
    uint256 index = 0;
    
    for (uint256 i = 0; i < allProducts.length; i++) {
      if (allProducts[i].categoryId == categoryId) {
        categoryProducts[index] = allProducts[i];
        index++;
      }
    }
    
    return categoryProducts;
  }

  // ===========================================
  // REGISTRY FUNCTIONS
  // ===========================================

  function getRegistryInfo() external view returns (
    address registryAddress,
    bool isConfigured,
    uint256 deploymentTime,
    string memory version
  ) {
    return (
      address(registry),
      registry.isConfigured(),
      registry.deploymentTimestamp(),
      "Registry v1.0.0"
    );
  }

  function getSystemStats() external view returns (
    uint256 totalProducts,
    uint256 totalSales,
    uint256 totalCategories,
    uint256 serviceFee
  ) {
    return (
      coreContract.getTotalProducts(),
      coreContract.getTotalSales(),
      0, // totalCategories - would need to be implemented
      storageContract.servicePct()
    );
  }
}