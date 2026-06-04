// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Faucet {
    address public token;
    uint256 public dispenseAmount;
    uint256 public dispenseInterval;
    mapping(address => uint256) public nextAccessTime;

    event Claim(address indexed claimant, uint256 amount);

    constructor(address _token, uint256 _dispenseAmount, uint256 _dispenseInterval) {
        token = _token;
        dispenseAmount = _dispenseAmount * 10**18;
        dispenseInterval = _dispenseInterval;
    }

    function claim() public {
        require(block.timestamp >= nextAccessTime[msg.sender], "Claim too frequent");
        require(IERC20(token).balanceOf(address(this)) >= dispenseAmount, "Faucet empty");
        
        nextAccessTime[msg.sender] = block.timestamp + dispenseInterval;
        IERC20(token).transfer(msg.sender, dispenseAmount);
        emit Claim(msg.sender, dispenseAmount);
    }

    receive() external payable {}
}
