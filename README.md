# InvoiceChain 

InvoiceChain is a decentralized invoice financing platform built on blockchain, allowing businesses to unlock liquidity from unpaid invoices and investors to earn predictable, short-term yields.

This project was built as part of a Web3 hackathon.

---

## What Problem Are We solving?

Businesses often wait 30–90 days to get paid on invoices, hurting cash flow.

InvoiceChain enables:
- Sellers to mint invoices as NFTs and get paid instantly
- Investors to purchase invoices at a discount
- Automatic repayment via smart contracts

All without intermediaries.

---

## Architecture Overview

### Frontend
- React + Next.js (Scaffold-ETH 2)
- RainbowKit + wagmi for wallet & blockchain interaction
- TailwindCSS for UI

### Blockchain / Backend
- Solidity smart contracts
- ERC-721 Invoice NFTs
- Marketplace contract with escrow logic
- KYC whitelist simulation
- Deployed on Mantle Sepolia Testnet

---

## User Flows

### Seller
1. Connect wallet
2. Complete KYC (simulated)
3. Upload invoice details
4. Mint Invoice NFT
5. Receive instant liquidity

### Investor
1. Connect wallet
2. Browse listed invoices
3. Buy invoice NFT at a discount
4. Receive full invoice value at maturity

---

## Running Locally

### Prerequisites
- Node.js
- Yarn

### Install & Run

```bash
yarn install
yarn chain      # start local blockchain
yarn start      # start frontend
