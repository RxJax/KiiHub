// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentEscrow {
    address payable public recipient;
    uint256 public releaseValue;
    uint256 public releaseTime;
    address public owner;

    event Released(address to, uint256 amount);

    constructor(address payable _recipient, uint256 _releaseValue, uint256 _releaseDelay) payable {
        recipient = _recipient;
        releaseValue = _releaseValue * 10**18; // in Wei/KII
        releaseTime = block.timestamp + _releaseDelay;
        owner = msg.sender;
    }

    function release() public {
        require(block.timestamp >= releaseTime, "Current time is before release time");
        require(address(this).balance >= releaseValue, "Insufficient contract balance");

        uint256 amount = releaseValue;
        recipient.transfer(amount);
        emit Released(recipient, amount);
    }

    receive() external payable {}
}
