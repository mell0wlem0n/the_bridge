// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    string public name = "IBT Token";
    string public symbol = "IBT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;

    mapping(address => uint256) public balanceOf;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    event TokensBurned(address indexed burner, uint256 amount, string destinationChain);
    event TokensMinted(address indexed minter, uint256 amount, string sourceChain);

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Not enough balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }

    function burnForBridge(uint256 amount, string calldata destinationChain) public {
        burn(amount);
        emit TokensBurned(msg.sender, amount, destinationChain);
    }

    function mintForBridge(address to, uint256 amount, string calldata sourceChain) public {
        mint(to, amount);
        emit TokensMinted(to, amount, sourceChain);
    }
}

