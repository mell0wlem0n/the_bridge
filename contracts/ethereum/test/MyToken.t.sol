// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/IBTToken.sol";

contract MyTokenTest is Test {
    MyToken public token;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.startPrank(owner);
        token = new MyToken();
        vm.stopPrank();
    }

    function testMint() public {
        vm.startPrank(owner);
        token.mint(user, 100 * 10**18);
        assertEq(token.balanceOf(user), 100 * 10**18);
        assertEq(token.totalSupply(), 100 * 10**18);
        vm.stopPrank();
    }

    function testBurn() public {
        vm.startPrank(owner);
        token.mint(user, 100 * 10**18);
        vm.stopPrank();

        vm.startPrank(user);
        token.burn(50 * 10**18);
        assertEq(token.balanceOf(user), 50 * 10**18);
        assertEq(token.totalSupply(), 50 * 10**18);
        vm.stopPrank();
    }

    function testOnlyOwnerCanMint() public {
        vm.startPrank(user);
        vm.expectRevert("Not the owner");
        token.mint(user, 100 * 10**18);
        vm.stopPrank();
    }
}

