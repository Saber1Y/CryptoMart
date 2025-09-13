// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './CryptoMartStorage.sol';

/**
 * @title CryptoMartTransactions
 * @dev Handles purchasing, reviews, and financial transactions
 * This separates heavy transactional logic to reduce contract sizes
 */
contract CryptoMartTransactions is Ownable, ReentrancyGuard {
  
  CryptoMartStorage public immutable storageContract;
  address public immutable coreContract;

  // --- Events ---
  event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller);
  event PurchaseRecorded(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 amount, uint256 timestamp);
  event PurchaseDelivered(uint256 indexed productId, address indexed buyer);
  event ReviewCreated(uint256 indexed productId, address indexed reviewer, uint256 rating);
  event ReviewDeleted(uint256 indexed productId, uint256 indexed reviewId);
  event BalanceWithdrawn(address indexed seller, uint256 amount);

  modifier onlyAuthorized() {
    require(msg.sender == coreContract || msg.sender == owner(), "Not authorized");
    _;
  }

  constructor(address _storageContract, address _coreContract) {
    storageContract = CryptoMartStorage(payable(_storageContract));
    coreContract = _coreContract;
  }

  // --- Purchase Functions ---
  function buyProduct(uint256 productId) external payable nonReentrant {
    CryptoMartStorage.ProductStruct memory product = storageContract.getProduct(productId);
    
    require(storageContract.productExists(productId), 'Product does not exist');
    require(!product.deleted, 'Product deleted');
    require(product.stock > 0, 'Out of stock');
    require(msg.value >= product.cost, 'Insufficient payment');
    require(product.seller != msg.sender, 'Cannot buy own product');

    // Update product stock
    product.stock--;
    storageContract.setProduct(productId, product);
    
    storageContract.incrementSales();
    
    // Calculate fees
    uint256 servicePct = storageContract.servicePct();
    uint256 fee = (msg.value * servicePct) / 100;
    uint256 sellerAmount = msg.value - fee;
    
    // Update seller balance
    storageContract.updateSellerBalance(product.seller, sellerAmount);
    
    // Record purchase
    CryptoMartStorage.PurchaseStruct memory purchase = CryptoMartStorage.PurchaseStruct({
      productId: productId,
      buyer: msg.sender,
      seller: product.seller,
      totalAmount: msg.value,
      timestamp: block.timestamp,
      isDelivered: false
    });
    
    storageContract.addPurchaseHistory(msg.sender, product.seller, purchase);
    
    emit ProductPurchased(productId, msg.sender, product.seller);
    emit PurchaseRecorded(productId, msg.sender, product.seller, msg.value, block.timestamp);

    // Transfer fees to storage contract for admin withdrawal
    if (fee > 0) {
      (bool success, ) = payable(address(storageContract)).call{value: fee}('');
      require(success, 'Fee transfer failed');
    }
  }

  function markPurchaseDelivered(uint256 productId, address buyer) external {
    CryptoMartStorage.ProductStruct memory product = storageContract.getProduct(productId);
    require(product.seller == msg.sender, 'Only seller can mark delivered');
    
    // Find and update the purchase record in buyer's history
    CryptoMartStorage.PurchaseStruct[] memory buyerHistory = storageContract.getBuyerPurchases(buyer);
    for (uint256 i = 0; i < buyerHistory.length; i++) {
      if (buyerHistory[i].productId == productId && buyerHistory[i].seller == msg.sender) {
        buyerHistory[i].isDelivered = true;
        // Note: In a real implementation, we'd need a way to update array elements
        // This is a limitation of the current storage pattern
        break;
      }
    }
    
    emit PurchaseDelivered(productId, buyer);
  }

  // --- Review Functions ---
  function createReview(uint256 productId, uint256 rating, string memory comment) external {
    require(storageContract.productExists(productId), 'Product does not exist');
    require(rating >= 1 && rating <= 5, 'Rating must be 1-5');
    
    uint256 reviewId = storageContract.incrementReviews();
    
    CryptoMartStorage.ReviewStruct memory review = CryptoMartStorage.ReviewStruct({
      reviewId: reviewId,
      reviewer: msg.sender,
      rating: rating,
      comment: comment,
      deleted: false,
      timestamp: block.timestamp
    });
    
    storageContract.addReview(productId, review);
    
    emit ReviewCreated(productId, msg.sender, rating);
  }

  function getReviews(uint256 productId) external view returns (CryptoMartStorage.ReviewStruct[] memory) {
    return storageContract.getProductReviews(productId);
  }

  function deleteReview(uint256 productId, uint256 reviewId) external {
    CryptoMartStorage.ReviewStruct[] memory reviews = storageContract.getProductReviews(productId);
    
    for (uint256 i = 0; i < reviews.length; i++) {
      if (reviews[i].reviewId == reviewId && (reviews[i].reviewer == msg.sender || msg.sender == owner())) {
        reviews[i].deleted = true;
        // Note: In a real implementation, we'd need a way to update array elements
        emit ReviewDeleted(productId, reviewId);
        break;
      }
    }
  }

  // --- Purchase History Functions ---
  function getBuyerPurchaseHistory(address buyer) external view returns (CryptoMartStorage.PurchaseStruct[] memory) {
    return storageContract.getBuyerPurchases(buyer);
  }

  function getSellerPurchaseHistory(address seller) external view returns (CryptoMartStorage.PurchaseStruct[] memory) {
    return storageContract.getSellerPurchases(seller);
  }

  // --- Withdrawal Functions ---
  function withdraw() external nonReentrant {
    uint256 balance = storageContract.sellerBalances(msg.sender);
    require(balance > 0, 'No balance to withdraw');
    
    storageContract.deductSellerBalance(msg.sender, balance);
    
    (bool success, ) = payable(msg.sender).call{value: balance}('');
    require(success, 'Withdrawal failed');
    
    emit BalanceWithdrawn(msg.sender, balance);
  }

  function getSellerBalance(address seller) external view returns (uint256) {
    return storageContract.sellerBalances(seller);
  }

  // --- Receive ETH for withdrawals ---
  receive() external payable {}
}
