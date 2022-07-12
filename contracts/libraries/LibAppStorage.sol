// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./LibDiamond.sol";

struct AppStorage {
    // Fake Gotchi Card ERC1155
    uint256 nextCardId;
    string cardBaseUri;
    mapping(uint256 => uint256) maxCards; // card id => max card amount
    mapping(address => mapping(uint256 => uint256)) cards; // owner => card id
    mapping(address => mapping(address => bool)) cardOperators; // owner => operator
}

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
