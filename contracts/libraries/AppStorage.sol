// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "./LibDiamond.sol";

uint8 constant METADATA_STATUS_PENDING = 0;
uint8 constant METADATA_STATUS_PAUSED = 1;
uint8 constant METADATA_STATUS_APPROVED = 2;
uint8 constant METADATA_STATUS_DECLINED = 3;

struct Metadata {
    string fileHash;
    string name;
    address publisher;
    string publisherName;
    string externalLink;
    string description;
    address artist;
    string artistName;
    uint256[2] royalty; // royalty[0]: publisher, royalty[1]: artist, sum should be 10000 (100%)
    uint256 rarity; // original editions, decrease when fake gotchi burned
    uint256 count; // start from original editions, decrease when fake gotchi mint
    uint256 createdAt;
    uint8 status;
    uint256 flagCount;
    uint256 likeCount;
}

struct AppStorage {
    address ghstContract;
    address aavegotchiDiamond;
    address fakeGotchisCardDiamond;
    // Metadata
    mapping(address => bool) blocked;
    uint256 metadataIdCounter; // start from 1, not 0
    uint256[] metadataIds;
    mapping(uint256 => Metadata) metadata;
    mapping(uint256 => address) metadataOwner;
    mapping(address => mapping(uint256 => uint256)) ownerMetadataIdIndexes;
    mapping(address => uint256[]) ownerMetadataIds;
    mapping(uint256 => mapping(address => bool)) metadataLiked;
    mapping(uint256 => mapping(address => bool)) metadataFlagged;
    // Fake Gotchis ERC721
    uint256 tokenIdCounter;
    uint256[] tokenIds;
    mapping(uint256 => uint256) fakeGotchis; // fake gotchi id => metadata id
    mapping(uint256 => address) fakeGotchiOwner; // fake gotchi id => owner
    mapping(address => mapping(uint256 => uint256)) ownerTokenIdIndexes;
    mapping(address => uint256[]) ownerTokenIds;
    mapping(address => mapping(address => bool)) operators;
    mapping(uint256 => address) approved;
    mapping(string => address) nameToPublisher;
    mapping(address => string) publisherToName;
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
