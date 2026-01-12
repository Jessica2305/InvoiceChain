"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useRouter } from "next/navigation";

const CreateInvoice: NextPage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [, setCompany] = useState("");
  const [price, setPrice] = useState("");

  const { data: totalSupply } = useScaffoldReadContract({
  contractName: "InvoiceNFT",
  functionName: "totalSupply",
  });

  // Contract Hooks
  const { writeContractAsync: mintInvoice } = useScaffoldWriteContract("InvoiceNFT");
  const { writeContractAsync: approveMarketplace } = useScaffoldWriteContract("InvoiceNFT");
  const { writeContractAsync: listInvoice } = useScaffoldWriteContract("CompliantInvoiceMarketplace");

  // YOUR DEPLOYED MARKETPLACE ADDRESS (Check Debug Contracts tab if this is wrong!)
  const MARKETPLACE_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; 

const handleCreateAndList = async () => {
  try {
    // Step 1: Mint
    console.log("Step 1: Minting...");
    const mintTx = await mintInvoice({
      functionName: "mintInvoice",
      args: [parseEther(amount), BigInt(Math.floor(new Date(dueDate).getTime() / 1000)), "invoice.pdf"],
    });

    // The new token ID will be the current totalSupply
    const newTokenId = totalSupply || 0n;

    // Step 2: Approve
    console.log("Step 2: Approving...");
    await approveMarketplace({
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, newTokenId],
    });

    // Step 3: List
    console.log("Step 3: Listing...");
    await listInvoice({
      functionName: "listInvoice",
      args: [newTokenId, parseEther(price), false],
    });

    alert(`Success! Invoice #${newTokenId} listed on Marketplace.`);
    router.push("/marketplace");
  } catch (e) {
    console.error(e);
    alert("Transaction failed. Check console for details.");
  }
};

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-8">List Your Invoice</h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sale Price (USDT)</label>
              <input 
                type="number" 
                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-4 text-white"
                placeholder="e.g. 9000"
                onChange={e => setPrice(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="w-full btn btn-lg bg-blue-600 hover:bg-blue-700 text-white border-none mt-4"
            onClick={handleCreateAndList}
          >
            Mint, Approve & List
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;