"use client";

import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Decentralized Invoice <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Financing
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mb-10">
          Convert outstanding invoices to immediate capital, or invest in verified corporate receivables for predictable returns.
        </p>
        <Link href="/marketplace" className="btn btn-primary btn-lg rounded-full px-10 text-lg border-none bg-blue-600 hover:bg-blue-700">
          Get Started ➔
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-20 border-t border-gray-800 pt-10 px-6">
        <div>
          <h3 className="text-4xl font-bold text-blue-500">$2.4M</h3>
          <p className="text-gray-500 mt-1">Total Volume</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-green-500">5.2%</h3>
          <p className="text-gray-500 mt-1">Avg Yield</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-purple-500">350+</h3>
          <p className="text-gray-500 mt-1">Active Users</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto mt-32 px-6 pb-20">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Seller Column */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-xl font-bold text-blue-400 mb-4">FOR SELLERS</h3>
            <h4 className="text-2xl font-semibold mb-4">Get Paid Immediately</h4>
            <ul className="space-y-4 text-gray-400">
              <li>• Upload invoices from verified companies.</li>
              <li>• Receive 95% of the invoice value instantly.</li>
              <li>• Improve cash flow for your business.</li>
            </ul>
          </div>
          {/* Investor Column */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-xl font-bold text-purple-400 mb-4">FOR INVESTORS</h3>
            <h4 className="text-2xl font-semibold mb-4">Earn Fixed Returns</h4>
            <ul className="space-y-4 text-gray-400">
              <li>• Browse KYC-verified invoices.</li>
              <li>• Purchase at a discount, receive full value later.</li>
              <li>• Earn 5-7% APY secured by smart contracts.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;