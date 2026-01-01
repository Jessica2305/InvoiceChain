"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const InvestorDashboard: NextPage = () => {
  const [tokenId, setTokenId] = useState<string>("0");

  // 1. READ the Listing Details automatically when Token ID changes
  const { data: listing } = useScaffoldReadContract({
    contractName: "CompliantInvoiceMarketplace",
    functionName: "listings",
    args: [BigInt(tokenId)],
  });

  // 2. WRITE Hook: Approve USDT
  const { writeContractAsync: approveUsdt } = useScaffoldWriteContract("MockUSDT");

  // 3. WRITE Hook: Buy Invoice
  const { writeContractAsync: buyInvoice } = useScaffoldWriteContract("CompliantInvoiceMarketplace");

  // Marketplace Address (Must match your deployment!)
  const MARKETPLACE_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  const handleApprove = async () => {
    if (!listing) return;
    try {
      await approveUsdt({
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, listing[1]], // listing[1] is the Price
      });
      alert("USDT Approved! Now you can Buy.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuy = async () => {
    try {
      await buyInvoice({
        functionName: "buyInvoice",
        args: [BigInt(tokenId)],
      });
      alert("Purchase Successful! You now own the Invoice NFT.");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col items-center flex-grow pt-10">
      <h1 className="text-4xl font-bold mb-8">Investor Market</h1>

      <div className="card w-96 bg-base-100 shadow-xl border-2 border-accent p-5">
        
        {/* Search Section */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text">Search Invoice ID</span>
          </label>
          <input
            type="number"
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="divider"></div>

        {/* Display Section */}
        {!listing ? (
          <p>Loading...</p>
        ) : listing[4] === false ? ( // listing[4] is 'isActive'
          <div className="alert alert-warning">
            <span>This invoice is not for sale (or already sold).</span>
          </div>
        ) : (
          <div>
            <div className="stat-value text-primary text-2xl mb-4">
              {formatEther(listing[1])} USDT
            </div>
            <p className="text-sm opacity-70 mb-4">
              Seller: {listing[0].substring(0, 8)}...
            </p>
            
            <div className="flex flex-col gap-2">
              <button className="btn btn-secondary" onClick={handleApprove}>
                1. Approve USDT
              </button>
              <button className="btn btn-primary" onClick={handleBuy}>
                2. Buy Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboard;