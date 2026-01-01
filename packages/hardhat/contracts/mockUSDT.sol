// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A fake USDT for testing
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether", "mUSDT") {
        // Mint 1,000,000 fake dollars to yourself (msg.sender)
        _mint(msg.sender, 1000000 * 10**18);
    }

    // A faucet so you can give your other test wallets money
    function getFreeTokens() external {
        _mint(msg.sender, 1000 * 10**18);
    }
}