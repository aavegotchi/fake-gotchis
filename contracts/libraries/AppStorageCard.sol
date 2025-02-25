// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./LibDiamond.sol";

struct CardAppStorage {
    address aavegotchiDiamond;
    address fakeGotchisNftDiamond;
    // Fake Gotchis Card ERC1155
    uint256 nextCardId;
    string cardBaseUri;
    mapping(uint256 => uint256) maxCards; // card id => max card amount
    mapping(address => mapping(address => bool)) operators;
    mapping(address => mapping(uint256 => uint256)) cards; // owner => card id
    bool diamondPaused;
}

library LibAppStorageCard {
    function diamondStorage() internal pure returns (CardAppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    CardAppStorage internal s;

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier onlyNftDiamond() {
        require(msg.sender == s.fakeGotchisNftDiamond, "LibDiamond: Must be NFT diamond");
        _;
    }

    modifier diamondPaused() {
        ///we exempt diamond owner from the freeze
        if (msg.sender != LibDiamond.contractOwner()) {
            require(!s.diamondPaused, "AppStorage: Diamond paused");
        }
        _;
    }
}
