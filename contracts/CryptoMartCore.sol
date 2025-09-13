// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './CryptoMartStorage.sol';

/**
 * @title CryptoMartCore
 * @dev Core business logic contract that interacts with CryptoMartStorage
 * This pattern separates storage from logic to reduce individual contract sizes
 */
contract CryptoMartCore is Ownable, ReentrancyGuard, ERC721 {
  
  CryptoMartStorage public immutable storageContract;

  // --- Events ---
  event ProductCreated(uint256 indexed productId, address indexed seller, string name, uint256 cost);
  event ProductUpdated(uint256 indexed productId);
  event ProductDeleted(uint256 indexed productId);
  event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller);
  event UserRegistered(address indexed user, string name);
  event SellerRegistered(address indexed seller, string businessName);
  event CategoryCreated(uint256 indexed categoryId, string name);
  event CategoryUpdated(uint256 indexed categoryId);
  event CategoryDeleted(uint256 indexed categoryId);
  event BalanceWithdrawn(address indexed seller, uint256 amount);
  event PurchaseRecorded(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 amount, uint256 timestamp);
  event PurchaseDelivered(uint256 indexed productId, address indexed buyer);
  event ReviewCreated(uint256 indexed productId, address indexed reviewer, uint256 rating);
  event ReviewDeleted(uint256 indexed productId, uint256 indexed reviewId);
  event SellerStatusUpdated(address indexed seller, CryptoMartStorage.SellerStatus status);

  constructor(address _storageContract) ERC721('CryptoMart', 'CMART') {
    storageContract = CryptoMartStorage(payable(_storageContract));
  }

  // --- User Functions ---
  function registerUser(string memory name, string memory email, string memory avatar) external {
    require(!storageContract.registeredUsers(msg.sender), 'User already registered');
    require(bytes(name).length > 0, 'Name required');

    CryptoMartStorage.UserProfile memory profile = CryptoMartStorage.UserProfile({
      name: name,
      email: email,
      avatar: avatar,
      isRegistered: true
    });

    storageContract.setUser(msg.sender, profile);
    emit UserRegistered(msg.sender, name);
  }

  function getUser(address user) external view returns (CryptoMartStorage.UserProfile memory) {
    return storageContract.getUser(user);
  }

  // --- Seller Functions ---
  function registerSeller(
    string memory businessName,
    string memory description,
    string memory email,
    string memory phone,
    string memory logo
  ) external {
    require(storageContract.registeredUsers(msg.sender), 'Must be registered user first');
    require(!storageContract.registeredSellers(msg.sender), 'Already registered as seller');
    require(bytes(businessName).length > 0, 'Business name required');

    CryptoMartStorage.SellerProfile memory profile = CryptoMartStorage.SellerProfile({
      businessName: businessName,
      description: description,
      email: email,
      phone: phone,
      logo: logo,
      isRegistered: true,
      registeredAt: block.timestamp
    });

    storageContract.setSeller(msg.sender, profile);
    storageContract.setSellerStatus(msg.sender, CryptoMartStorage.SellerStatus.Pending);
    
    emit SellerRegistered(msg.sender, businessName);
  }

  function getSeller(address seller) external view returns (
    CryptoMartStorage.SellerProfile memory,
    CryptoMartStorage.SellerStatus
  ) {
    return storageContract.getSeller(seller);
  }

  function getSellerProfile(address seller) external view returns (CryptoMartStorage.SellerProfile memory) {
    (CryptoMartStorage.SellerProfile memory profile, ) = storageContract.getSeller(seller);
    return profile;
  }

  function getAllSellers() external view returns (address[] memory) {
    return storageContract.getAllRegisteredSellers();
  }

  function getAllRegisteredSellers() external view returns (address[] memory) {
    return storageContract.getAllRegisteredSellers();
  }

  function getPendingVerificationUsers() external view returns (address[] memory) {
    return storageContract.getPendingVerificationUsers();
  }

  function getSellerStatus(address seller) external view returns (CryptoMartStorage.SellerStatus) {
    (, CryptoMartStorage.SellerStatus status) = storageContract.getSeller(seller);
    return status;
  }

  function updateSellerStatus(address seller, CryptoMartStorage.SellerStatus status) external onlyOwner {
    storageContract.setSellerStatus(seller, status);
    emit SellerStatusUpdated(seller, status);
  }

  function grantOwnerSellerAccess() external onlyOwner {
    if (!storageContract.registeredSellers(owner())) {
      CryptoMartStorage.SellerProfile memory profile = CryptoMartStorage.SellerProfile({
        businessName: "CryptoMart Admin",
        description: "Platform Administrator",
        email: "admin@cryptomart.com",
        phone: "",
        logo: "",
        isRegistered: true,
        registeredAt: block.timestamp
      });
      
      storageContract.setSeller(owner(), profile);
      storageContract.setSellerStatus(owner(), CryptoMartStorage.SellerStatus.Verified);
    }
  }

  // --- Category Functions ---
  function createCategory(string memory _name) external onlyOwner {
    require(bytes(_name).length > 0, 'Category name required');
    
    uint256 categoryId = storageContract.incrementCategories();
    
    CryptoMartStorage.CategoryStruct memory category = CryptoMartStorage.CategoryStruct({
      id: categoryId,
      name: _name,
      isActive: true
    });
    
    storageContract.setCategory(categoryId, category);
    emit CategoryCreated(categoryId, _name);
  }

  function updateCategory(uint256 id, string memory name, bool isActive) external onlyOwner {
    CryptoMartStorage.CategoryStruct memory existingCategory = storageContract.getCategory(id);
    require(existingCategory.id != 0, 'Category does not exist');
    
    CryptoMartStorage.CategoryStruct memory updatedCategory = CryptoMartStorage.CategoryStruct({
      id: id,
      name: name,
      isActive: isActive
    });
    
    storageContract.setCategory(id, updatedCategory);
    emit CategoryUpdated(id);
  }

  function deleteCategory(uint256 id) external onlyOwner {
    CryptoMartStorage.CategoryStruct memory category = storageContract.getCategory(id);
    require(category.id != 0, 'Category does not exist');
    
    category.isActive = false;
    storageContract.setCategory(id, category);
    
    emit CategoryDeleted(id);
  }

  function getCategory(uint256 id) external view returns (uint256, string memory, bool, uint256[] memory) {
    CryptoMartStorage.CategoryStruct memory cat = storageContract.getCategory(id);
    uint256[] memory empty;
    return (cat.id, cat.name, cat.isActive, empty);
  }

  function getAllCategories() external view returns (CryptoMartStorage.CategoryStruct[] memory) {
    uint256 totalCategories = storageContract.categoryCounter();
    CryptoMartStorage.CategoryStruct[] memory allCategories = new CryptoMartStorage.CategoryStruct[](totalCategories);
    uint256 count = 0;
    
    for (uint256 i = 1; i <= totalCategories; i++) {
      CryptoMartStorage.CategoryStruct memory category = storageContract.getCategory(i);
      if (category.isActive) {
        allCategories[count] = category;
        count++;
      }
    }
    
    // Resize array to actual count
    CryptoMartStorage.CategoryStruct[] memory activeCategories = new CryptoMartStorage.CategoryStruct[](count);
    for (uint256 i = 0; i < count; i++) {
      activeCategories[i] = allCategories[i];
    }
    
    return activeCategories;
  }

  // --- Product Functions ---
  function createProduct(
    string memory name,
    string memory description,
    string memory image,
    uint256 categoryId,
    uint256 cost,
    uint256 stock
  ) external {
    require(storageContract.registeredSellers(msg.sender), 'Must be registered seller');
    (, CryptoMartStorage.SellerStatus status) = storageContract.getSeller(msg.sender);
    require(status == CryptoMartStorage.SellerStatus.Verified, 'Must be verified seller');
    require(bytes(name).length > 0, 'Name required');
    require(cost > 0, 'Cost must be greater than zero');
    
    CryptoMartStorage.CategoryStruct memory category = storageContract.getCategory(categoryId);
    require(category.isActive, 'Invalid category');

    uint256 productId = storageContract.incrementProducts();

    CryptoMartStorage.ProductStruct memory newProduct = CryptoMartStorage.ProductStruct({
      id: productId,
      seller: msg.sender,
      name: name,
      description: description,
      image: image,
      categoryId: categoryId,
      cost: cost,
      stock: stock,
      timestamp: block.timestamp,
      deleted: false
    });

    storageContract.setProduct(productId, newProduct);
    storageContract.addSellerProduct(msg.sender, productId);
    storageContract.setProductCategory(productId, categoryId);

    emit ProductCreated(productId, msg.sender, name, cost);
  }

  function updateProduct(
    uint256 productId,
    string memory name,
    string memory description,
    string memory image,
    uint256 categoryId,
    uint256 cost,
    uint256 stock
  ) external {
    require(storageContract.productExists(productId), 'Product does not exist');
    CryptoMartStorage.ProductStruct memory product = storageContract.getProduct(productId);
    require(product.seller == msg.sender || msg.sender == owner(), 'Not authorized');
    require(!product.deleted, 'Product deleted');
    require(bytes(name).length > 0, 'Name required');
    require(cost > 0, 'Cost must be greater than zero');

    CryptoMartStorage.CategoryStruct memory category = storageContract.getCategory(categoryId);
    require(category.isActive, 'Invalid category');

    CryptoMartStorage.ProductStruct memory updatedProduct = CryptoMartStorage.ProductStruct({
      id: productId,
      seller: product.seller,
      name: name,
      description: description,
      image: image,
      categoryId: categoryId,
      cost: cost,
      stock: stock,
      timestamp: product.timestamp, // Keep original timestamp
      deleted: false
    });

    storageContract.setProduct(productId, updatedProduct);
    storageContract.setProductCategory(productId, categoryId);

    emit ProductUpdated(productId);
  }

  function deleteProduct(uint256 productId) external {
    require(storageContract.productExists(productId), 'Product does not exist');
    CryptoMartStorage.ProductStruct memory product = storageContract.getProduct(productId);
    require(product.seller == msg.sender || msg.sender == owner(), 'Not authorized');

    // Mark product as deleted
    product.deleted = true;
    storageContract.setProduct(productId, product);
    
    emit ProductDeleted(productId);
  }

  // --- View Functions for Products ---
  function getProduct(uint256 productId) public view returns (CryptoMartStorage.ProductStruct memory) {
    require(storageContract.productExists(productId), 'Product does not exist');
    return storageContract.getProduct(productId);
  }

  function getAllProducts() public view returns (CryptoMartStorage.ProductStruct[] memory) {
    uint256 totalProducts = storageContract.totalProducts();
    CryptoMartStorage.ProductStruct[] memory allProducts = new CryptoMartStorage.ProductStruct[](totalProducts);
    uint256 count = 0;
    
    for (uint256 i = 1; i <= totalProducts; i++) {
      if (storageContract.productExists(i)) {
        CryptoMartStorage.ProductStruct memory product = storageContract.getProduct(i);
        if (!product.deleted) {
          allProducts[count] = product;
          count++;
        }
      }
    }
    
    // Resize array
    CryptoMartStorage.ProductStruct[] memory activeProducts = new CryptoMartStorage.ProductStruct[](count);
    for (uint256 i = 0; i < count; i++) {
      activeProducts[i] = allProducts[i];
    }
    
    return activeProducts;
  }

  function getMyProducts() public view returns (CryptoMartStorage.ProductStruct[] memory) {
    uint256[] memory productIds = storageContract.getSellerProducts(msg.sender);
    CryptoMartStorage.ProductStruct[] memory myProducts = new CryptoMartStorage.ProductStruct[](productIds.length);
    
    for (uint256 i = 0; i < productIds.length; i++) {
      myProducts[i] = storageContract.getProduct(productIds[i]);
    }
    
    return myProducts;
  }

  function getSellerProducts(address seller) external view returns (CryptoMartStorage.ProductStruct[] memory) {
    uint256[] memory productIds = storageContract.getSellerProducts(seller);
    CryptoMartStorage.ProductStruct[] memory sellerProductList = new CryptoMartStorage.ProductStruct[](productIds.length);
    
    for (uint256 i = 0; i < productIds.length; i++) {
      sellerProductList[i] = storageContract.getProduct(productIds[i]);
    }
    
    return sellerProductList;
  }

  // --- Admin Functions ---
  function changeServicePct(uint256 newPct) external onlyOwner {
    require(newPct <= 10, 'Service fee too high');
    storageContract.setServicePct(newPct);
  }

  function withdrawServiceFees() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No fees to withdraw');
    
    (bool success, ) = payable(owner()).call{value: balance}('');
    require(success, 'Fee withdrawal failed');
  }

  // --- Stats Functions ---
  function getTotalProducts() external view returns (uint256) {
    return storageContract.totalProducts();
  }

  function getTotalSales() external view returns (uint256) {
    return storageContract.totalSales();
  }

  // --- Receive ETH ---
  receive() external payable {}
}
