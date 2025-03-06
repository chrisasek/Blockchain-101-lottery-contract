// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Lottery
 * @dev A lottery game contract.
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        // require(msg.value > .01 ether);
        require(msg.value >= 0.02 ether, "Minimum 0.02 ETH required");
        players.push(msg.sender);
    }

    function random() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.prevrandao, block.timestamp, players)
                )
            );
    }

    function pickWinner() public restricted {
        // require(msg.sender == manager);

        uint256 index = random() % players.length;
        payable(players[index]).transfer(address(this).balance);

        // players = new address[](0);
        delete players;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
