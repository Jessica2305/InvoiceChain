"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Marketplace: NextPage = () => {
  // Hackathon Shortcut: We hardcode IDs 0, 1, 2 to check for listings.
  // In production, you would use an indexer (The Graph) to fetch all active listings.
  const invoiceIds = [0, 1, 2, 3]; 

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Available Invoices</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {invoiceIds.map((id) => (
            <InvoiceCard key={id} tokenId={id} />
          ))}
        </div>
      </div>
    </div>
  );
};

// The Component that handles the Logic
const InvoiceCard = ({ tokenId }: { tokenId: number }) => {
  // 1. Read Data from Blockchain
  const { data: listing } = useScaffoldReadContract({
    contractName: "CompliantInvoiceMarketplace",
    functionName: "listings",
    args: [BigInt(tokenId)],
  });

  // 2. Prepare Write Functions
  const { writeContractAsync: buyInvoice } = useScaffoldWriteContract("CompliantInvoiceMarketplace");
  const { writeContractAsync: approveUsdt } = useScaffoldWriteContract("MockUSDT");

  // YOUR DEPLOYED MARKETPLACE ADDRESS
  const MARKETPLACE_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  const handleBuy = async () => {
    if(!listing) return;
    try {
      // Step A: Approve Marketplace to spend your USDT
      console.log("Approving USDT...");
      await approveUsdt({ 
        functionName: "approve", 
        args: [MARKETPLACE_ADDRESS, listing[1]] // listing[1] is the price
      });

      // Step B: Buy the Invoice
      console.log("Buying Invoice...");
      await buyInvoice({ 
        functionName: "buyInvoice", 
        args: [BigInt(tokenId)] 
      });
      
      alert("Purchase Successful!");
    } catch (e) { 
      console.error(e);
      alert("Purchase failed (Did you mint free USDT first?)");
    }
  };

  // If listing doesn't exist or isn't active (bool is at index 4), hide the card
  if (!listing || !listing[4]) return null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-gray-400">#{tokenId}</span>
        <span className="badge badge-success bg-green-500/10 text-green-400 border-none">Active</span>
      </div>
      
      <div className="text-3xl font-bold mb-1">${formatEther(listing[2])}</div>
      <div className="text-sm text-gray-500 mb-6">Invoice Face Value</div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Buy Price</span>
          <span className="font-semibold text-blue-300">${formatEther(listing[1])}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Seller</span>
          <span className="font-mono text-xs text-gray-500">{listing[0].substring(0, 8)}...</span>
        </div>
      </div>

      <button 
        onClick={handleBuy}
        className="w-full btn bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg"
      >
        Approve & Buy Invoice
      </button>
    </div>
  );
};

export default Marketplace;