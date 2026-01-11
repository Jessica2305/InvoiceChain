"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Shield, FileText, ArrowRight } from 'lucide-react';
import { ethers } from 'ethers';


const INVOICE_NFT_ADDRESS = "0xB3FC86d90c44A76B7f72b9B38Db336E060cCB67"; 
const MARKETPLACE_ADDRESS = "0xF4Fc93a1533C41e76d1a11DA7ba38a7ff1773278"; 

const NFT_ABI = [
  "function mintInvoice(uint256 _amount, uint256 _dueDate, string _pdfLink)",
  "function setApprovalForAll(address operator, bool approved)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

//  FIXED ABI: Added 'address _nftContract' as the first argument
const MARKET_ABI = [
  "function listInvoice(address _nftContract, uint256 _tokenId, uint256 _amount)"
];
// ----------------------------------------------------------------------


const mockInvoices = [
  {
    id: 1,
    amount: 10000,
    discountedPrice: 9500,
    yield: 5.26,
    dueDate: '2025-02-22',
    company: 'Meta Platforms Inc.',
    status: 'listed'
  },
  {
    id: 2,
    amount: 25000,
    discountedPrice: 23750,
    yield: 5.26,
    dueDate: '2025-03-01',
    company: 'Google LLC',
    status: 'listed'
  },
  {
    id: 3,
    amount: 15000,
    discountedPrice: 14400,
    yield: 4.17,
    dueDate: '2025-02-28',
    company: 'Amazon Web Services',
    status: 'listed'
  }
];

export default function InvoiceFactoringApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isConnected, setIsConnected] = useState(false);
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            setIsConnected(true);
            if (currentPage === 'home') {
                setCurrentPage('app');
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        alert("Please install MetaMask!");
    }
  };

  const handleKYCVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsKYCVerified(true);
      setIsVerifying(false);
    }, 2000);
  };

  // ---------------------------------------------------------
  // THE FIXED LOGIC (Mint -> Approve -> List)
  // ---------------------------------------------------------
  const handleMintAndList = async () => {
    if (!invoiceAmount || !dueDate) return;
    setIsLoading(true);

    try {
        if (!window.ethereum) throw new Error("No crypto wallet found");
        
        // 1. Setup Ethers
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const nftContract = new ethers.Contract(INVOICE_NFT_ADDRESS, NFT_ABI, signer);
        const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKET_ABI, signer);

        // 2. Mint Invoice
        console.log("Step 1: Minting...");
        const unixDate = Math.floor(new Date(dueDate).getTime() / 1000);
        
        // Note: Sending 'invoiceAmount' as simple number string. 
        // If your contract expects Wei (18 decimals), change to: ethers.parseEther(invoiceAmount)
        const tx1 = await nftContract.mintInvoice(invoiceAmount, unixDate, "https://ipfs.io/demo-invoice.pdf");
        await tx1.wait();
        alert("Mint Successful! Next: Approve Marketplace.");

        // 3. Approve Marketplace
        console.log("Step 2: Approving...");
        const tx2 = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await tx2.wait();
        
        // 4. Find the Token ID
        // We grab the ID of the *first* invoice this wallet owns to be safe
        const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, 0);
        console.log("Listing Token ID:", tokenId.toString());

        // 5. List on Marketplace (THE FIX IS HERE)
        console.log("Step 3: Listing...");
        const price = Math.floor(Number(invoiceAmount) * 0.95); 
        
        //  PASSING INVOICE_NFT_ADDRESS FIRST (Fixes 'Invalid Address' error)
        const tx3 = await marketContract.listInvoice(INVOICE_NFT_ADDRESS, tokenId, price);
        await tx3.wait();

        alert("SUCCESS! Invoice Listed on Blockchain.");
        setIsLoading(false);
        setActiveTab('marketplace'); 

    } catch (error: any) {
        console.error("Transaction Failed:", error);
        alert(`Error: ${error.reason || error.message || "Check Console"}`);
        setIsLoading(false);
    }
  };


  const handleBuyInvoice = (invoice:any) => {
    if (!isKYCVerified) {
      alert('Please complete KYC verification first!');
      return;
    }
    alert(`Buying invoice #${invoice.id} for $${invoice.discountedPrice}`);
  };

  const calculateDaysUntilDue = (dueDate:any) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Number(due) - Number(today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // LANDING PAGE
  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>

        {/* Navigation */}
        <nav className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/30 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className={`flex justify-between items-center h-20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-110">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">InvoiceChain</span>
              </div>
              
              <button
                onClick={handleConnectWallet}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
              >
                Launch App
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20 relative z-10">
          <div className={`max-w-3xl transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-6 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium text-blue-300">Built on Mantle Network</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-6 leading-tight">
              Decentralized Invoice Financing
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Convert outstanding invoices to immediate capital, or invest in verified corporate receivables for predictable returns.
            </p>
            <button
              onClick={handleConnectWallet}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-12 max-w-2xl mt-20 pt-12 border-t border-slate-800/50 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="group cursor-default">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">$2.4M</div>
              <div className="text-sm text-slate-500">Total Volume</div>
            </div>
            <div className="group cursor-default">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">5.2%</div>
              <div className="text-sm text-slate-500">Avg Yield</div>
            </div>
            <div className="group cursor-default">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">350+</div>
              <div className="text-sm text-slate-500">Active Users</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-900/30 backdrop-blur-xl py-24 border-y border-slate-800/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-16">How It Works</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="group">
                <div className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wide">For Sellers</div>
                <h3 className="text-2xl font-bold text-white mb-6">Get Paid Immediately</h3>
                <div className="space-y-4 text-slate-400">
                  <p className="transition-all duration-300 group-hover:text-slate-300">Upload invoices from verified companies with payment terms of 30-60 days.</p>
                  <p className="transition-all duration-300 group-hover:text-slate-300">Receive 95% of the invoice value instantly in your wallet.</p>
                  <p className="transition-all duration-300 group-hover:text-slate-300">Skip the waiting period and improve cash flow for your business.</p>
                </div>
              </div>

              <div className="group">
                <div className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wide">For Investors</div>
                <h3 className="text-2xl font-bold text-white mb-6">Earn Fixed Returns</h3>
                <div className="space-y-4 text-slate-400">
                  <p className="transition-all duration-300 group-hover:text-slate-300">Browse KYC-verified invoices from reputable corporations.</p>
                  <p className="transition-all duration-300 group-hover:text-slate-300">Purchase invoices at a discount and receive full value at maturity.</p>
                  <p className="transition-all duration-300 group-hover:text-slate-300">Earn 5-7% returns on short-term, low-risk investments secured by smart contracts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-8 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-slate-500">
            © 2025 InvoiceChain. Built on Mantle Network.
          </div>
        </footer>
      </div>
    );
  }

  // APP DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
      
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-110">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">InvoiceChain</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {isConnected && !isKYCVerified && (
                <button
                  onClick={handleKYCVerify}
                  disabled={isVerifying}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying...' : 'Complete KYC'}</span>
                </button>
              )}
              
              {isConnected && isKYCVerified && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-lg border border-green-500/20 backdrop-blur-sm animate-pulse">
                  <Shield className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
              
              <div className="px-4 py-2 bg-slate-800/50 text-slate-300 text-sm rounded-lg font-mono border border-slate-700/50 backdrop-blur-sm">
                {isConnected ? '0x...Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/30 border-b border-slate-800/50 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 text-sm font-medium border-b-2 transition-all duration-300 relative ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative z-10">Marketplace</span>
              {activeTab === 'marketplace' && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-t-lg -z-0"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`py-4 text-sm font-medium border-b-2 transition-all duration-300 relative ${
                activeTab === 'sell'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative z-10">List Invoice</span>
              {activeTab === 'sell' && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-t-lg -z-0"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 text-sm font-medium border-b-2 transition-all duration-300 relative ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative z-10">Portfolio</span>
              {activeTab === 'portfolio' && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-t-lg -z-0"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        {/* Marketplace View */}
        {activeTab === 'marketplace' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-8">Available Invoices</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {mockInvoices.map((invoice, index) => (
                <div 
                  key={invoice.id} 
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 group hover:-translate-y-1"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">#{invoice.id}</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">${invoice.amount.toLocaleString()}</div>
                    </div>
                    <div className="text-sm font-semibold text-green-400 bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">
                      {invoice.yield.toFixed(2)}%
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company</span>
                      <span className="text-slate-200 font-medium">{invoice.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="text-slate-200 font-medium">${invoice.discountedPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due In</span>
                      <span className="text-slate-200 font-medium">{calculateDaysUntilDue(invoice.dueDate)} days</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyInvoice(invoice)}
                    disabled={!isConnected}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 group-hover:scale-105"
                  >
                    Purchase Invoice
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sell Invoice View */}
        {activeTab === 'sell' && (
          <div className="max-w-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-8">List Your Invoice</h2>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Invoice Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Meta Platforms Inc."
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Invoice Document
                  </label>
                  <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-12 text-center hover:border-blue-500/50 transition-all duration-500 cursor-pointer bg-slate-900/20 hover:bg-slate-900/40 group-hover:scale-[1.02]">
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3 transition-colors duration-300 group-hover:text-blue-400" />
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Upload PDF or image</p>
                  </div>
                </div>

                {invoiceAmount && (
                  <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 space-y-2 text-sm animate-fade-in">
                    <div className="flex justify-between">
                      <span className="text-slate-400">You receive</span>
                      <span className="font-semibold text-green-400">
                        ${(parseFloat(invoiceAmount) * 0.95).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Platform fee</span>
                      <span className="text-slate-300">${(parseFloat(invoiceAmount) * 0.01).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleMintAndList}
                  disabled={!isConnected || !invoiceAmount || !clientName || !dueDate || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                >
                  {isLoading ? 'Processing Blockchain Tx...' : 'Create Invoice NFT & List'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio View */}
        {activeTab === 'portfolio' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-8">Portfolio Overview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-500 group hover:-translate-y-1">
                <div className="text-sm text-slate-400 mb-2">Total Invested</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">$47,650</div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/50 transition-all duration-500 group hover:-translate-y-1" style={{animationDelay: '100ms'}}>
                <div className="text-sm text-slate-400 mb-2">Expected Returns</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">$2,482</div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-500 group hover:-translate-y-1" style={{animationDelay: '200ms'}}>
                <div className="text-sm text-slate-400 mb-2">Active Positions</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">3</div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <p className="text-slate-400">No active investments</p>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}