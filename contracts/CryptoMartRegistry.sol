
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title CryptoMartRegistry
 * @dev Lightweight registry that tracks deployed contract addresses
 * This replaces the heavy Factory pattern with a simple registry approach
 */
contract CryptoMartRegistry is Ownable {
  
  // --- Contract Addresses ---
  address public storageContract;
  address public coreContract;
  address public transactionsContract;
  
  // --- Deployment State ---
  bool public isConfigured = false;
  uint256 public deploymentTimestamp;

  // --- Events ---
  event SystemConfigured(
    address indexed storage_,
    address indexed core,
    address indexed transactions,
    uint256 timestamp
  );

  constructor() {
    // Registry is owned by deployer
  }

  /**
   * @dev Configure the system with deployed contract addresses
   * @param _storage Address of deployed CryptoMartStorage
   * @param _core Address of deployed CryptoMartCore
   * @param _transactions Address of deployed CryptoMartTransactions
   */
  function configureSystem(
    address _storage,
    address _core,
    address _transactions
  ) external onlyOwner {
    require(!isConfigured, "System already configured");
    require(_storage != address(0), "Invalid storage address");
    require(_core != address(0), "Invalid core address");
    require(_transactions != address(0), "Invalid transactions address");

    storageContract = _storage;
    coreContract = _core;
    transactionsContract = _transactions;
    
    isConfigured = true;
    deploymentTimestamp = block.timestamp;

    emit SystemConfigured(_storage, _core, _transactions, block.timestamp);
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
    require(isConfigured, "System not configured");
    return (storageContract, coreContract, transactionsContract);
  }

  /**
   * @dev Update a contract address (for upgrades)
   * @param contractType Type of contract (0=storage, 1=core, 2=transactions)
   * @param newAddress New contract address
   */
  function updateContract(uint8 contractType, address newAddress) external onlyOwner {
    require(isConfigured, "System not configured");
    require(newAddress != address(0), "Invalid address");

    address oldAddress;
    
    if (contractType == 0) {
      oldAddress = storageContract;
      storageContract = newAddress;
    } else if (contractType == 1) {
      oldAddress = coreContract;
      coreContract = newAddress;
    } else if (contractType == 2) {
      oldAddress = transactionsContract;
      transactionsContract = newAddress;
    } else {
      revert("Invalid contract type");
    }

    emit ContractUpgraded(contractType, oldAddress, newAddress);
  }

  event ContractUpgraded(uint8 contractType, address oldAddress, address newAddress);
}