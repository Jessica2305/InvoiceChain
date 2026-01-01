// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./InvoiceNFT.sol";

/**
 * @title ComplianceRegistry
 * @notice Manages KYC/AML verification and accreditation status
 */
contract ComplianceRegistry is AccessControl {
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");
    
    enum KYCStatus { None, Pending, Approved, Rejected, Suspended }
    enum InvestorType { None, Retail, Accredited, Institutional }
    
    struct KYCRecord {
        KYCStatus status;
        InvestorType investorType;
        string jurisdiction; // ISO country code
        uint256 approvalDate;
        uint256 expiryDate;
        bool canTrade;
        bool canReceiveYield;
    }
    
    mapping(address => KYCRecord) public kycRecords;
    mapping(string => bool) public restrictedJurisdictions; // Blocked countries
    
    event KYCStatusUpdated(address indexed user, KYCStatus status, InvestorType investorType);
    event JurisdictionRestricted(string jurisdiction, bool restricted);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Submit KYC application
     */
    function submitKYC(string calldata jurisdiction) external {
        require(kycRecords[msg.sender].status == KYCStatus.None, "KYC already submitted");
        require(!restrictedJurisdictions[jurisdiction], "Jurisdiction restricted");
        
        kycRecords[msg.sender] = KYCRecord({
            status: KYCStatus.Pending,
            investorType: InvestorType.None,
            jurisdiction: jurisdiction,
            approvalDate: 0,
            expiryDate: 0,
            canTrade: false,
            canReceiveYield: false
        });
        
        emit KYCStatusUpdated(msg.sender, KYCStatus.Pending, InvestorType.None);
    }
    
    /**
     * @notice Approve KYC (Admin only)
     */
    function approveKYC(
        address user,
        InvestorType investorType,
        uint256 validityPeriod // in seconds (e.g., 365 days)
    ) external onlyRole(KYC_ADMIN_ROLE) {
        require(kycRecords[user].status == KYCStatus.Pending, "Not pending");
        
        kycRecords[user].status = KYCStatus.Approved;
        kycRecords[user].investorType = investorType;
        kycRecords[user].approvalDate = block.timestamp;
        kycRecords[user].expiryDate = block.timestamp + validityPeriod;
        kycRecords[user].canTrade = true;
        kycRecords[user].canReceiveYield = true;
        
        emit KYCStatusUpdated(user, KYCStatus.Approved, investorType);
    }
    
    /**
     * @notice Reject or suspend KYC
     */
    function updateKYCStatus(address user, KYCStatus newStatus) external onlyRole(KYC_ADMIN_ROLE) {
        kycRecords[user].status = newStatus;
        
        if (newStatus == KYCStatus.Rejected || newStatus == KYCStatus.Suspended) {
            kycRecords[user].canTrade = false;
            kycRecords[user].canReceiveYield = false;
        }
        
        emit KYCStatusUpdated(user, newStatus, kycRecords[user].investorType);
    }
    
    /**
     * @notice Restrict/unrestrict jurisdictions
     */
    function setJurisdictionRestriction(string calldata jurisdiction, bool restricted) 
        external 
        onlyRole(KYC_ADMIN_ROLE) 
    {
        restrictedJurisdictions[jurisdiction] = restricted;
        emit JurisdictionRestricted(jurisdiction, restricted);
    }
    
    /**
     * @notice Check if user can participate
     */
    function isCompliant(address user) public view returns (bool) {
        KYCRecord memory record = kycRecords[user];
        return record.status == KYCStatus.Approved 
            && record.canTrade 
            && block.timestamp < record.expiryDate;
    }
    
    /**
     * @notice Check if user can receive yield
     */
    function canReceiveYield(address user) public view returns (bool) {
        return kycRecords[user].canReceiveYield && isCompliant(user);
    }
}

/**
 * @title CustodyVault
 * @notice Secure custody solution for invoice NFTs and yield distribution
 */
contract CustodyVault is AccessControl, ReentrancyGuard {
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    
    InvoiceNFT public nftContract;
    IERC20 public usdtToken;
    ComplianceRegistry public complianceRegistry;
    
    struct CustodyAccount {
        address beneficiary;
        uint256[] heldTokenIds;
        uint256 pendingYield;
        uint256 totalYieldEarned;
        bool isActive;
    }
    
    mapping(address => CustodyAccount) public custodyAccounts;
    mapping(uint256 => address) public tokenCustody; // tokenId => beneficiary
    
    event CustodyCreated(address indexed beneficiary);
    event AssetDeposited(address indexed beneficiary, uint256 tokenId);
    event AssetWithdrawn(address indexed beneficiary, uint256 tokenId);
    event YieldDistributed(address indexed beneficiary, uint256 amount);
    event YieldClaimed(address indexed beneficiary, uint256 amount);
    
    constructor(
        address _nftContract,
        address _usdtToken,
        address _complianceRegistry
    ) {
        nftContract = InvoiceNFT(_nftContract);
        usdtToken = IERC20(_usdtToken);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CUSTODIAN_ROLE, msg.sender);
    }
    
    /**
     * @notice Create custody account
     */
    function createCustodyAccount() external {
        require(complianceRegistry.isCompliant(msg.sender), "KYC required");
        require(!custodyAccounts[msg.sender].isActive, "Account exists");
        
        custodyAccounts[msg.sender].beneficiary = msg.sender;
        custodyAccounts[msg.sender].isActive = true;
        
        emit CustodyCreated(msg.sender);
    }
    
    /**
     * @notice Deposit invoice NFT into custody
     */
    function depositAsset(uint256 tokenId) external nonReentrant {
        require(custodyAccounts[msg.sender].isActive, "No custody account");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        
        // Transfer to vault
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);
        
        custodyAccounts[msg.sender].heldTokenIds.push(tokenId);
        tokenCustody[tokenId] = msg.sender;
        
        emit AssetDeposited(msg.sender, tokenId);
    }
    
    /**
     * @notice Withdraw asset from custody
     */
    function withdrawAsset(uint256 tokenId) external nonReentrant {
        require(tokenCustody[tokenId] == msg.sender, "Not your asset");
        require(complianceRegistry.isCompliant(msg.sender), "KYC expired");
        
        // Remove from custody tracking
        _removeTokenFromAccount(msg.sender, tokenId);
        delete tokenCustody[tokenId];
        
        // Transfer back
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit AssetWithdrawn(msg.sender, tokenId);
    }
    
    /**
     * @notice Distribute yield to custody account (Custodian only)
     */
    function distributeYield(address beneficiary, uint256 amount) 
        external 
        onlyRole(CUSTODIAN_ROLE) 
        nonReentrant 
    {
        require(complianceRegistry.canReceiveYield(beneficiary), "Cannot receive yield");
        require(custodyAccounts[beneficiary].isActive, "No custody account");
        
        custodyAccounts[beneficiary].pendingYield += amount;
        custodyAccounts[beneficiary].totalYieldEarned += amount;
        
        emit YieldDistributed(beneficiary, amount);
    }
    
    /**
     * @notice Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        require(complianceRegistry.canReceiveYield(msg.sender), "Cannot claim yield");
        
        uint256 amount = custodyAccounts[msg.sender].pendingYield;
        require(amount > 0, "No yield to claim");
        
        custodyAccounts[msg.sender].pendingYield = 0;
        
        bool success = usdtToken.transfer(msg.sender, amount);
        require(success, "Yield transfer failed");
        
        emit YieldClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Get custody account info
     */
    function getCustodyInfo(address beneficiary) 
        external 
        view 
        returns (
            uint256[] memory tokenIds,
            uint256 pendingYield,
            uint256 totalYieldEarned
        ) 
    {
        CustodyAccount memory account = custodyAccounts[beneficiary];
        return (
            account.heldTokenIds,
            account.pendingYield,
            account.totalYieldEarned
        );
    }
    
    function _removeTokenFromAccount(address beneficiary, uint256 tokenId) private {
        uint256[] storage tokens = custodyAccounts[beneficiary].heldTokenIds;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
    
    function onERC721Received(address, address, uint256, bytes calldata) 
        external 
        pure 
        returns (bytes4) 
    {
        return this.onERC721Received.selector;
    }
}

/**
 * @title CompliantInvoiceMarketplace
 * @notice Enhanced marketplace with KYC, custody, and compliant yield distribution
 */
contract CompliantInvoiceMarketplace is IERC721Receiver, ReentrancyGuard {
    
    InvoiceNFT public nftContract;
    IERC20 public usdtToken;
    ComplianceRegistry public complianceRegistry;
    CustodyVault public custodyVault;
    
    struct Listing {
        address seller;
        uint256 price;
        uint256 faceValue;
        uint256 maturityDate;
        bool isActive;
        bool useCustody; // If true, NFT goes to custody vault after purchase
    }
    
    mapping(uint256 => Listing) public listings;
    
    // Yield tracking for tax/reporting compliance
    struct YieldRecord {
        uint256 purchasePrice;
        uint256 repaymentAmount;
        uint256 yieldEarned;
        uint256 timestamp;
        address investor;
    }
    
    mapping(uint256 => YieldRecord) public yieldRecords;
    
    event InvoiceListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 faceValue);
    event InvoicePurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event InvoiceRepaid(uint256 indexed tokenId, address indexed holder, uint256 amount, uint256 yield);
    event ListingCancelled(uint256 indexed tokenId);
    
    modifier onlyCompliant() {
        require(complianceRegistry.isCompliant(msg.sender), "KYC verification required");
        _;
    }
    
    constructor(
        address _nftAddress,
        address _usdtAddress,
        address _complianceRegistry,
        address _custodyVault
    ) {
        nftContract = InvoiceNFT(_nftAddress);
        usdtToken = IERC20(_usdtAddress);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        custodyVault = CustodyVault(_custodyVault);
    }
    
    /**
     * @notice List invoice with optional custody
     */
    function listInvoice(uint256 tokenId, uint256 _price, bool _useCustody) 
        external 
        onlyCompliant 
        nonReentrant 
    {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        
        InvoiceNFT.Invoice memory inv = nftContract.getInvoice(tokenId);
        require(!inv.isPaid, "Cannot list paid invoice");
        require(_price < inv.amount, "Price must be discounted");
        
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            faceValue: inv.amount,
            maturityDate: inv.dueDate,
            isActive: true,
            useCustody: _useCustody
        });
        
        emit InvoiceListed(tokenId, msg.sender, _price, inv.amount);
    }
    
    /**
     * @notice Purchase invoice (with optional custody)
     */
    function buyInvoice(uint256 tokenId) external onlyCompliant nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        
        // Payment
        bool success = usdtToken.transferFrom(msg.sender, listing.seller, listing.price);
        require(success, "USDT transfer failed");
        
        // Track for yield calculation
        yieldRecords[tokenId] = YieldRecord({
            purchasePrice: listing.price,
            repaymentAmount: 0,
            yieldEarned: 0,
            timestamp: block.timestamp,
            investor: msg.sender
        });
        
        // Transfer asset
        if (listing.useCustody) {
            // Send to custody vault for the buyer
            nftContract.safeTransferFrom(address(this), address(custodyVault), tokenId);
        } else {
            // Direct transfer to buyer
            nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        }
        
        listing.isActive = false;
        
        emit InvoicePurchased(tokenId, msg.sender, listing.price);
    }
    
    /**
     * @notice Repay invoice with compliant yield distribution
     */
    function repayInvoice(uint256 tokenId) external nonReentrant {
        InvoiceNFT.Invoice memory inv = nftContract.getInvoice(tokenId);
        require(!inv.isPaid, "Already repaid");
        
        address currentHolder = nftContract.ownerOf(tokenId);
        YieldRecord storage record = yieldRecords[tokenId];
        
        // Calculate yield
        uint256 yieldAmount = inv.amount > record.purchasePrice 
            ? inv.amount - record.purchasePrice 
            : 0;
        
        // Check if holder can receive yield
        require(complianceRegistry.canReceiveYield(currentHolder), "Holder cannot receive yield");
        
        // Repayment
        bool success = usdtToken.transferFrom(msg.sender, currentHolder, inv.amount);
        require(success, "Repayment failed");
        
        // Update yield record for compliance reporting
        record.repaymentAmount = inv.amount;
        record.yieldEarned = yieldAmount;
        
        nftContract.markInvoicePaid(tokenId);
        
        emit InvoiceRepaid(tokenId, currentHolder, inv.amount, yieldAmount);
    }
    
    /**
     * @notice Cancel listing
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(msg.sender == listing.seller, "Not your listing");
        
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        delete listings[tokenId];
        
        emit ListingCancelled(tokenId);
    }
    
    /**
     * @notice Get yield data for tax reporting
     */
    function getYieldRecord(uint256 tokenId) 
        external 
        view 
        returns (YieldRecord memory) 
    {
        return yieldRecords[tokenId];
    }
    
    function onERC721Received(address, address, uint256, bytes calldata) 
        external 
        pure 
        override 
        returns (bytes4) 
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}