// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title CryptoMartStorage
 * @dev Storage contract that holds all the data for CryptoMart
 * This separates storage from logic to reduce contract size
 */
contract CryptoMartStorage is Ownable {
  
  // --- Core Counters ---
  uint256 public totalProducts;
  uint256 public totalSales;
  uint256 public totalReviews;
  uint256 public categoryCounter;
  uint256 public servicePct;

  // --- Enums ---
  enum SellerStatus { Unverified, Pending, Verified, Suspended }

  // --- Structs ---
  struct ProductStruct {
    uint256 id;
    address seller;
    string name;
    string description;
    string image;
    uint256 categoryId;
    uint256 cost;
    uint256 stock;
    uint256 timestamp;
    bool deleted;
  }

  struct UserProfile {
    string name;
    string email;
    string avatar;
    bool isRegistered;
  }

  struct SellerProfile {
    string businessName;
    string description;
    string email;
    string phone;
    string logo;
    bool isRegistered;
    uint256 registeredAt;
  }

  struct CategoryStruct {
    uint256 id;
    string name;
    bool isActive;
  }

  struct PurchaseStruct {
    uint256 productId;
    address buyer;
    address seller;
    uint256 totalAmount;
    uint256 timestamp;
    bool isDelivered;
  }

  struct ReviewStruct {
    uint256 reviewId;
    address reviewer;
    uint256 rating;
    string comment;
    bool deleted;
    uint256 timestamp;
  }

  // --- Core Mappings ---
  mapping(uint256 => ProductStruct) public products;
  mapping(address => uint256[]) public sellerProducts;
  mapping(uint256 => bool) public productExists;
  mapping(address => UserProfile) public userProfiles;
  mapping(address => bool) public registeredUsers;
  mapping(address => SellerProfile) public sellerProfiles;
  mapping(address => bool) public registeredSellers;
  mapping(address => SellerStatus) public sellerStatus;
  mapping(address => uint256) public sellerBalances;
  mapping(uint256 => CategoryStruct) public categories;
  mapping(address => PurchaseStruct[]) public buyerPurchaseHistory;
  mapping(address => PurchaseStruct[]) public sellerPurchaseHistory;
  mapping(uint256 => ReviewStruct[]) public productReviews;
  mapping(uint256 => uint256) public productCategories;

  // --- Lists ---
  address[] public registeredSellersList;
  address[] public usersList;
  address[] public pendingVerificationUsers;

  // --- Access Control ---
  mapping(address => bool) public authorizedContracts;

  modifier onlyAuthorized() {
    require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
    _;
  }

  constructor(uint256 _servicePct) {
    servicePct = _servicePct;
    authorizedContracts[msg.sender] = true; // Factory is authorized
  }

  // --- Authorization Functions ---
  function addAuthorizedContract(address _contract) external onlyOwner {
    authorizedContracts[_contract] = true;
  }

  function removeAuthorizedContract(address _contract) external onlyOwner {
    authorizedContracts[_contract] = false;
  }

  // --- Counter Functions ---
  function incrementProducts() external onlyAuthorized returns (uint256) {
    totalProducts++;
    return totalProducts;
  }

  function incrementSales() external onlyAuthorized returns (uint256) {
    totalSales++;
    return totalSales;
  }

  function incrementReviews() external onlyAuthorized returns (uint256) {
    totalReviews++;
    return totalReviews;
  }

  function incrementCategories() external onlyAuthorized returns (uint256) {
    categoryCounter++;
    return categoryCounter;
  }

  // --- Data Modification Functions ---
  function setProduct(uint256 id, ProductStruct memory product) external onlyAuthorized {
    products[id] = product;
    productExists[id] = true;
  }

  function addSellerProduct(address seller, uint256 productId) external onlyAuthorized {
    sellerProducts[seller].push(productId);
  }

  function setUser(address user, UserProfile memory profile) external onlyAuthorized {
    userProfiles[user] = profile;
    if (!registeredUsers[user]) {
      registeredUsers[user] = true;
      usersList.push(user);
    }
  }

  function setSeller(address seller, SellerProfile memory profile) external onlyAuthorized {
    sellerProfiles[seller] = profile;
    if (!registeredSellers[seller]) {
      registeredSellers[seller] = true;
      registeredSellersList.push(seller);
    }
  }

  function setSellerStatus(address seller, SellerStatus status) external onlyAuthorized {
    sellerStatus[seller] = status;
    
    // Add to pending if needed
    if (status == SellerStatus.Pending) {
      pendingVerificationUsers.push(seller);
    }
    
    // Remove from pending if verified
    if (status == SellerStatus.Verified) {
      for (uint256 i = 0; i < pendingVerificationUsers.length; i++) {
        if (pendingVerificationUsers[i] == seller) {
          pendingVerificationUsers[i] = pendingVerificationUsers[pendingVerificationUsers.length - 1];
          pendingVerificationUsers.pop();
          break;
        }
      }
    }
  }

  function updateSellerBalance(address seller, uint256 amount) external onlyAuthorized {
    sellerBalances[seller] += amount;
  }

  function deductSellerBalance(address seller, uint256 amount) external onlyAuthorized {
    require(sellerBalances[seller] >= amount, "Insufficient balance");
    sellerBalances[seller] -= amount;
  }

  function setCategory(uint256 id, CategoryStruct memory category) external onlyAuthorized {
    categories[id] = category;
  }

  function addPurchaseHistory(address buyer, address seller, PurchaseStruct memory purchase) external onlyAuthorized {
    buyerPurchaseHistory[buyer].push(purchase);
    sellerPurchaseHistory[seller].push(purchase);
  }

  function addReview(uint256 productId, ReviewStruct memory review) external onlyAuthorized {
    productReviews[productId].push(review);
  }

  function setProductCategory(uint256 productId, uint256 categoryId) external onlyAuthorized {
    productCategories[productId] = categoryId;
  }

  function setServicePct(uint256 _servicePct) external onlyAuthorized {
    servicePct = _servicePct;
  }

  // --- View Functions ---
  function getProduct(uint256 id) external view returns (ProductStruct memory) {
    return products[id];
  }

  function getSellerProducts(address seller) external view returns (uint256[] memory) {
    return sellerProducts[seller];
  }

  function getUser(address user) external view returns (UserProfile memory) {
    return userProfiles[user];
  }

  function getSeller(address seller) external view returns (SellerProfile memory, SellerStatus) {
    return (sellerProfiles[seller], sellerStatus[seller]);
  }

  function getCategory(uint256 id) external view returns (CategoryStruct memory) {
    return categories[id];
  }

  function getBuyerPurchases(address buyer) external view returns (PurchaseStruct[] memory) {
    return buyerPurchaseHistory[buyer];
  }

  function getSellerPurchases(address seller) external view returns (PurchaseStruct[] memory) {
    return sellerPurchaseHistory[seller];
  }

  function getProductReviews(uint256 productId) external view returns (ReviewStruct[] memory) {
    return productReviews[productId];
  }

  function getAllRegisteredSellers() external view returns (address[] memory) {
    return registeredSellersList;
  }

  function getPendingVerificationUsers() external view returns (address[] memory) {
    return pendingVerificationUsers;
  }
}
