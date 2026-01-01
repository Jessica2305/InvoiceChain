"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

const Portfolio: NextPage = () => {
  const { address } = useAccount();

  // 1. Get USDT Balance
  const { data: usdtBalance } = useScaffoldReadContract({
    contractName: "MockUSDT",
    functionName: "balanceOf",
    args: [address],
  });

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Portfolio Overview</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Cash Balance Card */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-gray-400 mb-2">Available Liquidity (USDT)</h3>
            <div className="text-4xl font-bold text-blue-500">
              ${usdtBalance ? Number(formatEther(usdtBalance)).toFixed(2) : "0.00"}
            </div>
          </div>

          {/* Static Stats for Demo Aesthetics */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-gray-400 mb-2">Total Invested</h3>
            <div className="text-4xl font-bold text-green-500">$0.00</div>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-gray-400 mb-2">Active Positions</h3>
            <div className="text-4xl font-bold text-purple-500">0</div>
          </div>
        </div>

        {/* Empty State / Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 text-center">
          <div className="flex flex-col items-center justify-center opacity-50">
             <div className="text-6xl mb-4">📉</div>
             <h3 className="text-xl">No active investments</h3>
             <p className="text-sm mt-2">Go to the Marketplace to buy your first invoice.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Portfolio;