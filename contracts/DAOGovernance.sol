// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract DAOGovernance {
    address public govToken;
    uint256 public votingPeriod; // in blocks
    uint256 public quorum; // minimum votes required

    struct Proposal {
        string description;
        uint256 endBlock;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 id, string description, uint256 endBlock);
    event VoteCast(address indexed voter, uint256 proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 proposalId);

    constructor(address _govToken, uint256 _votingPeriod, uint256 _quorum) {
        govToken = _govToken;
        votingPeriod = _votingPeriod;
        quorum = _quorum;
    }

    function createProposal(string memory description) public returns (uint256) {
        uint256 proposalId = proposals.length;
        Proposal storage p = proposals.push();
        p.description = description;
        p.endBlock = block.number + votingPeriod;
        
        emit ProposalCreated(proposalId, description, p.endBlock);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) public {
        Proposal storage p = proposals[proposalId];
        require(block.number < p.endBlock, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = IERC20(govToken).balanceOf(msg.sender);
        require(weight > 0, "No voting weight");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    function executeProposal(uint256 proposalId) public {
        Proposal storage p = proposals[proposalId];
        require(block.number >= p.endBlock, "Voting still active");
        require(!p.executed, "Already executed");
        require(p.votesFor + p.votesAgainst >= quorum, "Quorum not met");
        require(p.votesFor > p.votesAgainst, "Proposal failed");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }
}
