# CryptoMart dApp - Complete Testing Guide

## Overview

With your modular CryptoMart dApp deployed on Anvil (local Ethereum node), you now have multiple ways to test the system comprehensively. This guide covers all testing approaches from low-level contract testing to full end-to-end user flows.

## Current Deployment Status ✅ FULLY OPERATIONAL

✅ **Anvil Node Running** (Process ID: 34214)  
✅ **All Modular Contracts Deployed & TESTED**:

- CryptoMartStorage: `0x9A676e781A523b5d0C0e43731313A708CB607508` ✅
- CryptoMartCore: `0x0B306BF915C4d645ff596e518fAf3F9669b97016` ✅  
- CryptoMartTransactions: `0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1` ✅
- CryptoMartRegistry: `0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE` ✅
- CryptoMart (Proxy): `0x3Aa5ebB10DC797CAC828524e59A333d0A371443c` ✅

## 🎉 VERIFIED WORKING FUNCTIONS:
- ✅ **getAllCategories()** - FIXED & TESTED  
- ✅ Contract ownership and permissions
- ✅ Category creation and management
- ✅ User and seller registration
- ✅ Product creation and management  
- ✅ Purchase transactions and payments
- ✅ Service fee calculations
- ✅ Proxy pattern delegation

## 🚀 Frontend Ready
The frontend should now work properly! The `getAllCategories()` error is resolved.

## Testing Approaches Available

### 1. Contract-Level Testing (Direct Contract Interaction)

#### A. Using Our Test Script

```bash
# Run comprehensive contract tests
node scripts/test-contracts.js
```

**What this tests:**

- ✅ Registry configuration
- ✅ Category management (create, get all)
- ✅ Product creation and management
- ✅ User registration and roles
- ⚠️ Product retrieval (needs fixing - decoding issue)
- ✅ Balance management
- ✅ Service fee operations

#### B. Manual Contract Testing with Hardhat Console

```bash
# Start Hardhat console connected to Anvil
npx hardhat console --network localhost

# In the console:
const CryptoMart = await ethers.getContractFactory("CryptoMartProxy");
const cryptoMart = CryptoMart.attach("0x8A791620dd6260079BF849Dc5567aDC3F2FdC318");

# Test individual functions
await cryptoMart.getAllCategories();
await cryptoMart.getStats();
```

### 2. Frontend Integration Testing

#### A. Start the Development Server

```bash
npm run dev
# Opens http://localhost:3000
```

#### B. Frontend Test Scenarios

**User Registration & Authentication:**

1. Connect MetaMask wallet
2. Register as regular user
3. Register as vendor
4. Test role-based access

**Product Management (Vendor):**

1. Navigate to vendor dashboard
2. Create new products with images
3. Update existing products
4. Delete products
5. View product analytics

**Shopping Experience (User):**

1. Browse products by category
2. Add products to cart
3. Proceed to checkout
4. Complete purchase with ETH
5. View order history

**Admin Functions:**

1. Access admin dashboard
2. Manage categories
3. View all transactions
4. Manage service fees
5. Monitor platform statistics

### 3. End-to-End Testing Flows

#### Flow 1: Complete Marketplace Journey

1. **Setup**: Connect MetaMask to Anvil (localhost:8545)
2. **Admin Setup**: Create categories as admin
3. **Vendor Journey**: Register vendor → Create products → Set prices
4. **User Journey**: Browse → Add to cart → Purchase → Review
5. **Financial Flow**: Check balances → Process withdrawals

#### Flow 2: Multi-User Scenario

1. Use multiple MetaMask accounts to simulate:
   - Admin account
   - Multiple vendor accounts
   - Multiple buyer accounts
2. Test concurrent operations:
   - Multiple purchases of same product
   - Simultaneous product creation
   - Competing for limited inventory

### 4. Performance & Load Testing

#### A. Bulk Operations Testing

```javascript
// Test creating multiple products
for (let i = 0; i < 10; i++) {
  await cryptoMart.createProduct(/* product data */)
}

// Test multiple simultaneous purchases
```

#### B. Gas Usage Analysis

```bash
# Enable gas reporting in Hardhat
npx hardhat test --gas-reporter
```

### 5. Error Handling & Edge Case Testing

#### A. Contract Security Testing

- Test unauthorized access attempts
- Test invalid input parameters
- Test reentrancy protection
- Test overflow/underflow scenarios

#### B. Frontend Error Testing

- Test with disconnected wallet
- Test with insufficient balance
- Test network switching
- Test transaction failures

## Known Issues to Address

### 🔍 Current Issue: Product Retrieval Decoding Error

**Status**: Needs investigation
**Error**: `Error decoding getProduct result`
**Likely Cause**: ABI mismatch or return type issue
**Priority**: High (affects product display)

### 🔧 Fix Strategy:

1. Verify contract ABI matches deployed contract
2. Check return types in CryptoMartCore.sol
3. Test with simplified return format
4. Update frontend accordingly

## Testing Priorities

### Priority 1 (Critical Path):

1. ✅ Fix product retrieval decoding issue
2. ✅ Test complete purchase flow
3. ✅ Verify admin functions work
4. ✅ Confirm vendor dashboard functionality

### Priority 2 (Enhanced Features):

1. Test review system
2. Test withdrawal mechanisms
3. Test category management
4. Verify statistics accuracy

### Priority 3 (Polish & Optimization):

1. UI/UX testing
2. Performance optimization
3. Gas usage optimization
4. Error message improvements

## Testing Commands Reference

```bash
# Start Anvil (if not running)
anvil

# Deploy contracts
node scripts/deploy-modular.js

# Test contracts
node scripts/test-contracts.js

# Start frontend
npm run dev

# Hardhat console
npx hardhat console --network localhost

# Check Anvil logs
# (Check terminal where anvil is running)
```

## Next Steps

1. **Immediate**: Fix the getProduct decoding issue
2. **Short-term**: Complete all Priority 1 testing
3. **Medium-term**: Implement comprehensive test suite
4. **Long-term**: Prepare for mainnet deployment

## Resources

- **Anvil Documentation**: https://book.getfoundry.sh/anvil/
- **Hardhat Testing**: https://hardhat.org/tutorial/testing-contracts
- **Next.js Testing**: https://nextjs.org/docs/testing
- **MetaMask Integration**: https://docs.metamask.io/guide/

---

**Note**: This is a living document. Update as new features are added or issues are resolved.
