"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const SellerDashboard: NextPage = () => {
  // State for form inputs
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tokenId, setTokenId] = useState("0"); // User needs to manually type ID for now (simplifies code)
  const [price, setPrice] = useState("");

  // 1. Hook to MINT Invoice
  const { writeContractAsync: mintInvoice } = useScaffoldWriteContract("InvoiceNFT");

  // 2. Hook to APPROVE Marketplace
  const { writeContractAsync: approveMarketplace } = useScaffoldWriteContract("InvoiceNFT");

  // 3. Hook to LIST Invoice
  const { writeContractAsync: listInvoice } = useScaffoldWriteContract("CompliantInvoiceMarketplace");

  // Helper to get Marketplace Address (Hardcoded for simplicity or fetched dynamically)
  // You can find this in your Debug tab. Replace this if it changes!
  const MARKETPLACE_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; 

  const handleMint = async () => {
    try {
      await mintInvoice({
        functionName: "mintInvoice",
        // Convert Amount to Wei, Date to timestamp, PDF is placeholder
        args: [parseEther(amount), BigInt(Math.floor(new Date(dueDate).getTime() / 1000)), "invoice.pdf"],
      });
      alert("Mint Successful! Now Approve the marketplace.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    try {
      await approveMarketplace({
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, BigInt(tokenId)],
      });
      alert("Approval Successful! Now List the invoice.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleList = async () => {
    try {
      await listInvoice({
        functionName: "listInvoice",
        args: [BigInt(tokenId), parseEther(price), BigInt(0)],
      });
      alert("Listing Successful! Your invoice is on the market.");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col items-center flex-grow pt-10">
      <h1 className="text-4xl font-bold mb-8">Seller Dashboard</h1>

      <div className="card w-96 bg-base-100 shadow-xl border-2 border-primary p-5">
        
        {/* Step 1: Mint */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Step 1: Mint Invoice</h2>
          <input
            type="number"
            placeholder="Amount (USDT)"
            className="input input-bordered w-full mb-2"
            onChange={e => setAmount(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered w-full mb-2"
            onChange={e => setDueDate(e.target.value)}
          />
          <button className="btn btn-primary w-full" onClick={handleMint}>
            Mint NFT
          </button>
        </div>

        <div className="divider"></div>

        {/* Step 2: Approve & List */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Step 2: Sell It</h2>
          <input
            type="number"
            placeholder="Token ID (Check Debug tab)"
            className="input input-bordered w-full mb-2"
            onChange={e => setTokenId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Sale Price (USDT)"
            className="input input-bordered w-full mb-2"
            onChange={e => setPrice(e.target.value)}
          />
          
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1" onClick={handleApprove}>
              A. Approve
            </button>
            <button className="btn btn-accent flex-1" onClick={handleList}>
              B. List
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerDashboard;