// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import './CryptoMartStorage.sol';
import './CryptoMartCore.sol';
import './CryptoMartTransactions.sol';

/**
 * @title CryptoMartFactory
 * @dev Factory contract that deploys and manages all CryptoMart components
 * 
 * EDUCATIONAL: Factory Pattern Explained
 * =====================================
 * 
 * The Factory Pattern in smart contracts is used to:
 * 1. Deploy multiple related contracts in a coordinated way
 * 2. Manage relationships between contracts
 * 3. Reduce individual contract sizes by separation of concerns
 * 4. Enable upgradeability through proxy patterns
 * 
 * Components:
 * - CryptoMartStorage: Holds all data and state
 * - CryptoMartCore: Core business logic (users, sellers, categories, products)
 * - CryptoMartTransactions: Transaction logic (buying, reviews, withdrawals)
 * - CryptoMartFactory: This contract - orchestrates everything
 * 
 * Benefits:
 * - Each contract is smaller and more focused
 * - Easier to test individual components
 * - Can upgrade logic contracts while keeping data
 * - Better gas optimization for different operations
 */
contract CryptoMartFactory is Ownable {
  
  // --- Contract Instances ---
  CryptoMartStorage public storageContract;
  CryptoMartCore public coreContract;
  CryptoMartTransactions public transactionsContract;

  // --- Deployment State ---
  bool public isDeployed = false;
  uint256 public deploymentTimestamp;

  // --- Events ---
  event CryptoMartDeployed(
    address indexed storage_,
    address indexed core,
    address indexed transactions,
    uint256 timestamp
  );
  event ContractUpgraded(string contractType, address oldAddress, address newAddress);

  constructor() {
    // Factory is initially owned by deployer
    // Actual CryptoMart contracts will be deployed via deployFullSystem()
  }

  /**
   * @dev Deploy all CryptoMart contracts in the correct order
   * @param servicePct Service fee percentage (e.g., 5 for 5%)
   * 
   * EDUCATIONAL: Deployment Order Matters!
   * =====================================
   * 1. First deploy Storage (needs no dependencies)
   * 2. Then deploy Core (needs Storage address)
   * 3. Finally deploy Transactions (needs Storage + Core addresses)
   * 4. Setup permissions between contracts
   */
  function deployFullSystem(uint256 servicePct) external onlyOwner {
    require(!isDeployed, "System already deployed");
    require(servicePct <= 10, "Service fee too high");

    // Step 1: Deploy Storage Contract
    storageContract = new CryptoMartStorage(servicePct);
    
    // Step 2: Deploy Core Contract (needs Storage address)
    coreContract = new CryptoMartCore(address(storageContract));
    
    // Step 3: Deploy Transactions Contract (needs Storage + Core addresses)  
    transactionsContract = new CryptoMartTransactions(
      address(storageContract),
      address(coreContract)
    );

    // Step 4: Setup Permissions
    // Allow Core contract to modify storage
    storageContract.addAuthorizedContract(address(coreContract));
    // Allow Transactions contract to modify storage  
    storageContract.addAuthorizedContract(address(transactionsContract));
    
    // Step 5: Transfer ownerships to factory for centralized management
    storageContract.transferOwnership(address(this));
    coreContract.transferOwnership(address(this));
    transactionsContract.transferOwnership(address(this));

    // Mark as deployed
    isDeployed = true;
    deploymentTimestamp = block.timestamp;

    emit CryptoMartDeployed(
      address(storageContract),
      address(coreContract),
      address(transactionsContract),
      block.timestamp
    );
  }

  /**
   * @dev Get all contract addresses
   * @return storage_ Storage contract address
   * @return core Core contract address  
   * @return transactions Transactions contract address
   */
  function getContractAddresses() external view returns (
    address storage_,
    address core,
    address transactions
  ) {
    return (
      address(storageContract),
      address(coreContract),
      address(transactionsContract)
    );
  }

  /**
   * @dev Upgrade the Core contract (keeping same storage)
   * @param newCoreContract Address of new Core contract
   * 
   * EDUCATIONAL: Upgradeability Pattern
   * ==================================
   * This allows upgrading business logic while preserving data
   * Steps:
   * 1. Deploy new Core contract with same Storage address
   * 2. Remove old Core from authorized contracts
   * 3. Add new Core to authorized contracts
   * 4. Update factory reference
   */
  function upgradeCoreContract(address newCoreContract) external onlyOwner {
    require(isDeployed, "System not deployed");
    require(newCoreContract != address(0), "Invalid address");
    
    address oldCore = address(coreContract);
    
    // Remove old core from authorized contracts
    storageContract.removeAuthorizedContract(oldCore);
    
    // Add new core to authorized contracts
    storageContract.addAuthorizedContract(newCoreContract);
    
    // Update factory reference
    coreContract = CryptoMartCore(payable(newCoreContract));
    
    emit ContractUpgraded("Core", oldCore, newCoreContract);
  }

  /**
   * @dev Upgrade the Transactions contract
   * @param newTransactionsContract Address of new Transactions contract
   */
  function upgradeTransactionsContract(address newTransactionsContract) external onlyOwner {
    require(isDeployed, "System not deployed");
    require(newTransactionsContract != address(0), "Invalid address");
    
    address oldTransactions = address(transactionsContract);
    
    // Remove old transactions from authorized contracts
    storageContract.removeAuthorizedContract(oldTransactions);
    
    // Add new transactions to authorized contracts
    storageContract.addAuthorizedContract(newTransactionsContract);
    
    // Update factory reference
    transactionsContract = CryptoMartTransactions(payable(newTransactionsContract));
    
    emit ContractUpgraded("Transactions", oldTransactions, newTransactionsContract);
  }

  /**
   * @dev Admin function - change service fee
   * @param newPct New service fee percentage
   */
  function changeServiceFee(uint256 newPct) external onlyOwner {
    require(isDeployed, "System not deployed");
    require(newPct <= 10, "Fee too high");
    
    // Use Core contract to change the fee (it will update storage)
    coreContract.changeServicePct(newPct);
  }

  /**
   * @dev Admin function - withdraw accumulated service fees
   */
  function withdrawServiceFees() external onlyOwner {
    require(isDeployed, "System not deployed");
    
    // Use Core contract to withdraw fees
    coreContract.withdrawServiceFees();
    
    // Transfer any ETH from this factory to owner
    uint256 balance = address(this).balance;
    if (balance > 0) {
      (bool success, ) = payable(owner()).call{value: balance}('');
      require(success, "Transfer failed");
    }
  }

  /**
   * @dev Get system statistics
   * @return totalProducts Total products created
   * @return totalSales Total sales made
   * @return totalCategories Total categories created
   * @return serviceFee Current service fee percentage
   */
  function getSystemStats() external view returns (
    uint256 totalProducts,
    uint256 totalSales, 
    uint256 totalCategories,
    uint256 serviceFee
  ) {
    require(isDeployed, "System not deployed");
    
    return (
      storageContract.totalProducts(),
      storageContract.totalSales(),
      storageContract.categoryCounter(),
      storageContract.servicePct()
    );
  }

  /**
   * @dev Emergency pause - remove all contract permissions
   * This effectively pauses the system by preventing state changes
   */
  function emergencyPause() external onlyOwner {
    require(isDeployed, "System not deployed");
    
    storageContract.removeAuthorizedContract(address(coreContract));
    storageContract.removeAuthorizedContract(address(transactionsContract));
  }

  /**
   * @dev Resume after emergency pause
   */
  function resumeFromPause() external onlyOwner {
    require(isDeployed, "System not deployed");
    
    storageContract.addAuthorizedContract(address(coreContract));
    storageContract.addAuthorizedContract(address(transactionsContract));
  }

  // --- Receive ETH for fee collection ---
  receive() external payable {}

  /**
   * @dev Get deployment information
   * @return deployed Whether system is deployed
   * @return timestamp When system was deployed
   * @return version Current version (could be extended for versioning)
   */
  function getDeploymentInfo() external view returns (
    bool deployed,
    uint256 timestamp,
    string memory version
  ) {
    return (isDeployed, deploymentTimestamp, "1.0.0");
  }
}
