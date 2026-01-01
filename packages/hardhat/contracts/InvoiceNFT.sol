// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Imports from OpenZeppelin (Standard Security Libraries)
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InvoiceNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    // Address of your Marketplace contract (We set this after deployment)
    address public marketplaceAddress;

    // 1. Define the Invoice Data Structure
    struct Invoice {
        uint256 amount;      // Amount in Wei (18 decimals)
        uint256 dueDate;     // Unix Timestamp
        string pdfLink;      // URL to IPFS or Google Drive
        address seller;      // The original creator
        bool isPaid;         // Status
    }

    // 2. Mappings (Databases)
    mapping(uint256 => Invoice) public invoices;

    // 3. Events (For your Frontend to listen to)
    event InvoiceCreated(uint256 indexed tokenId, address indexed seller, uint256 amount);
    event InvoicePaid(uint256 indexed tokenId);

    // 4. Constructor
    // Ownable(msg.sender) makes YOU the admin when you deploy
    constructor() ERC721("InvoiceNFT", "INV") Ownable(msg.sender) {}

    // --- MODIFIERS (Security Guards) ---

    modifier onlyMarketplace() {
        require(msg.sender == marketplaceAddress, "Security: Only Marketplace can call this");
        _;
    }

    // --- ADMIN FUNCTIONS (Only You) ---

    // Step 2: Connect the Marketplace contract
    function setMarketplaceAddress(address _marketplace) external onlyOwner {
        marketplaceAddress = _marketplace;
    }

    // --- CORE LOGIC ---

    // Step 3: Users mint invoices
    function mintInvoice(uint256 _amount, uint256 _dueDate, string memory _pdfLink) 
        external 
        returns (uint256) 
    {
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);

        invoices[tokenId] = Invoice({
            amount: _amount,
            dueDate: _dueDate,
            pdfLink: _pdfLink,
            seller: msg.sender,
            isPaid: false
        });

        emit InvoiceCreated(tokenId, msg.sender, _amount);
        return tokenId;
    }

    // Step 4: Marketplace marks invoice as paid
    function markInvoicePaid(uint256 tokenId) external onlyMarketplace {
        require(invoices[tokenId].isPaid == false, "Invoice already paid");
        invoices[tokenId].isPaid = true;
        emit InvoicePaid(tokenId);
    }

    // Helper: View all invoice details
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        return invoices[tokenId];
    }
}