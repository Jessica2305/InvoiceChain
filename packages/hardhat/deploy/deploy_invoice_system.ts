import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const deployInvoiceSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. Deploy Mock USDT (so we have a currency to trade)
  const usdt = await deploy("MockUSDT", {
    from: deployer,
    args: [],
    log: true,
  });

  // 2. Deploy InvoiceNFT
  const nft = await deploy("InvoiceNFT", {
    from: deployer,
    args: [],
    log: true,
  });

  // 3. Deploy ComplianceRegistry (Required by Marketplace)
  const compliance = await deploy("ComplianceRegistry", {
    from: deployer,
    args: [],
    log: true,
  });

  // 4. Deploy CustodyVault (Required by Marketplace)
  const custody = await deploy("CustodyVault", {
    from: deployer,
    args: [nft.address, usdt.address, compliance.address],
    log: true,
  });

  // 5. Deploy the Marketplace (The main contract)
  const marketplace = await deploy("CompliantInvoiceMarketplace", {
    from: deployer,
    args: [
      nft.address,        // _nftAddress
      usdt.address,       // _usdtAddress
      compliance.address, // _complianceRegistry
      custody.address     // _custodyVault
    ],
    log: true,
  });

  // 6. Post-Deploy Setup: Connect Marketplace to NFT
  // Your InvoiceNFT needs to know the marketplace address to allow it to mark invoices as paid.
  const invoiceNftContract = await ethers.getContractAt("InvoiceNFT", nft.address);
  
  // Check if it's already set to avoid errors on re-runs
  const currentMarketplace = await invoiceNftContract.marketplaceAddress();
  if (currentMarketplace !== marketplace.address) {
    console.log("Setting Marketplace address in InvoiceNFT...");
    await invoiceNftContract.setMarketplaceAddress(marketplace.address);
  }
};

export default deployInvoiceSystem;
deployInvoiceSystem.tags = ["InvoiceSystem"];