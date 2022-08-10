// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./LibDiamond.sol";

uint8 constant METADATA_STATUS_PENDING = 0;
uint8 constant METADATA_STATUS_APPROVED = 1;
uint8 constant METADATA_STATUS_DECLINED = 2;

struct Metadata {
    string fileHash;
    bytes32 name;
    address publisher;
    string publisherName;
    string externalLink;
    string description;
    address artist;
    string artistName;
    uint256[2] royalty; // royalty[0]: publisher, royalty[1]: artist
    uint256 rarity;
    uint256 count;
    uint256 createdAt;
    uint8 status;
}

struct CardAppStorage {
    address nftDiamond;
    // Fake Gotchi Card ERC1155
    uint256 nextCardId;
    string cardBaseUri;
    mapping(uint256 => uint256) maxCards; // card id => max card amount
    mapping(address => mapping(address => bool)) operators;
    mapping(address => mapping(uint256 => uint256)) cards; // owner => card id
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
        require(msg.sender == s.nftDiamond, "LibDiamond: Must be NFT diamond");
        _;
    }
}
