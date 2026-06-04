// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ERC721 {
    string public name;
    string public symbol;
    string public baseURI;
    uint256 public nextTokenId;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory _name, string memory _symbol, string memory _baseURI) {
        name = _name;
        symbol = _symbol;
        baseURI = _baseURI;
    }

    function mint(address to) public returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == from, "Not owner");
        require(msg.sender == from || getApproved[tokenId] == msg.sender || isApprovedForAll[from][msg.sender], "Not approved");
        getApproved[tokenId] = address(0);
        balanceOf[from]--;
        balanceOf[to]++;
        ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf[tokenId];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not approved");
        getApproved[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
}
