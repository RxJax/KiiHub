// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleSwapPool {
    address public owner;
    address public tokenAddress; // The ERC20 stablecoin (USDC or USDT)
    uint256 public rate; // How many ERC20 tokens per 1 KII (e.g. 245 = 2.45 tokens)

    event SwappedKiiForToken(address indexed user, uint256 kiiAmount, uint256 tokenAmount);
    event SwappedTokenForKii(address indexed user, uint256 tokenAmount, uint256 kiiAmount);
    event LiquidityAdded(uint256 kiiAmount, uint256 tokenAmount);
    event LiquidityWithdrawn(uint256 kiiAmount, uint256 tokenAmount);

    constructor(address _tokenAddress, uint256 _rate) payable {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        rate = _rate; // rate is scaled by 100, so 2.45 is represented as 245
    }

    // Swap KII to get Stablecoin
    receive() external payable {
        swapKiiForToken();
    }

    fallback() external payable {
        swapKiiForToken();
    }

    function swapKiiForToken() public payable {
        require(msg.value > 0, "Must send KII");
        uint256 tokenAmount = (msg.value * rate) / 100;
        
        // Verify pool has enough stablecoin reserves
        uint256 poolBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(poolBalance >= tokenAmount, "Insufficient stablecoin reserves in pool");

        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        emit SwappedKiiForToken(msg.sender, msg.value, tokenAmount);
    }

    // Swap Stablecoin to get KII
    function swapTokenForKii(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Amount must be > 0");
        uint256 kiiAmount = (tokenAmount * 100) / rate;
        
        require(address(this).balance >= kiiAmount, "Insufficient KII reserves in pool");

        // Transfer stablecoin from user to pool (requires allowance)
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        
        // Send KII to user
        payable(msg.sender).transfer(kiiAmount);
        emit SwappedTokenForKii(msg.sender, tokenAmount, kiiAmount);
    }

    // Owner functions to manage pool
    function withdrawReserves() external {
        require(msg.sender == owner, "Only owner");
        uint256 kiiBalance = address(this).balance;
        uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        
        if (kiiBalance > 0) payable(owner).transfer(kiiBalance);
        if (tokenBalance > 0) IERC20(tokenAddress).transfer(owner, tokenBalance);
        
        emit LiquidityWithdrawn(kiiBalance, tokenBalance);
    }
    
    // Allow pool to receive arbitrary deposits
    function depositLiquidity(uint256 tokenAmount) external payable {
        if (tokenAmount > 0) {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        }
        emit LiquidityAdded(msg.value, tokenAmount);
    }
}
