// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../interfaces/ICardDiamond.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {ERC721Marketplace} from "../../interfaces/ERC721Marketplace.sol";

contract MetadataFacet is Modifiers {
    event MetadataActionLog(
        uint256 indexed id,
        address indexed sender,
        string fileHash,
        bytes32 name,
        address publisher,
        string publisherName,
        string externalLink,
        string description,
        address artist,
        string artistName,
        uint256[2] royalty,
        uint256 rarity,
        uint256 createdAt,
        uint8 status
    );

    function getMetadata(uint256 _id) external view returns (Metadata memory) {
        require(_id < s.metadataIdCounter, "Metadata: _id is greater than total count.");
        return s.metadata[_id];
    }

    struct MetadataInput {
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
    }

    function addMetadata(MetadataInput memory mData, uint256 count) external {
        address _sender = LibMeta.msgSender();
        // check blocked
        require(!s.blocked[_sender], "Metadata: Blocked address");

        // Parameter validation
        verifyMetadata(mData, count);

        // Burn card
        ICardDiamond(s.cardDiamond).burn(_sender, count);

        // save
        uint256 _metadataId = s.metadataIdCounter;
        s.metadata[_metadataId] = Metadata({
            fileHash: mData.fileHash,
            name: mData.name,
            publisher: mData.publisher,
            publisherName: mData.publisherName,
            externalLink: mData.externalLink,
            description: mData.description,
            artist: mData.artist,
            artistName: mData.artistName,
            royalty: mData.royalty,
            rarity: mData.rarity,
            count: count,
            createdAt: block.timestamp,
            status: METADATA_STATUS_PENDING
        });

        s.ownerMetadataIdIndexes[_sender][_metadataId] = s.ownerMetadataIds[_sender].length;
        s.ownerMetadataIds[_sender].push(_metadataId);
        s.metadataIds.push(_metadataId);
        s.metadataOwner[_metadataId] = _sender;
        s.metadataIdCounter++;

        // emit event with metadata input
        logMetadata(_metadataId);
    }

    function approveMetadata(uint256 _id) external onlyOwner {
        require(_id < s.metadataIdCounter, "Metadata: _id is greater than total count.");
        require(s.metadata[_id].status != METADATA_STATUS_APPROVED, "Metadata: Already approved");

        s.metadata[_id].status = METADATA_STATUS_APPROVED;

        // emit event with metadata input
        logMetadata(_id);
    }

    function declineMetadata(uint256 _id, bool isBadFaith) external onlyOwner {
        require(_id < s.metadataIdCounter, "Metadata: _id is greater than total count.");
        require(s.metadata[_id].status != METADATA_STATUS_APPROVED, "Metadata: Already approved");

        s.metadata[_id].status = METADATA_STATUS_DECLINED;
        if (isBadFaith) {
            s.blocked[s.metadataOwner[_id]] = true;
        }

        // emit event with metadata input
        logMetadata(_id);
    }

    function mint(uint256 _id) external {
        address _sender = LibMeta.msgSender();
        require(_sender == s.metadataOwner[_id], "Metadata: Not metadata owner");
        Metadata memory mData = s.metadata[_id];
        require(mData.status == METADATA_STATUS_APPROVED, "Metadata: Not approved");
        require(mData.count != 0, "Metadata: Already mint");
        LibERC721.safeBatchMint(mData.publisher, _id, mData.count);
        s.metadata[_id].count = 0;
    }

    function verifyMetadata(MetadataInput memory mData, uint256 count) internal pure {
        require(mData.publisher != address(0), "Metadata: Publisher cannot be zero address");
        require(bytes(mData.fileHash).length > 0, "Metadata: File hash should exist");
        require(bytes(mData.description).length <= 120, "Metadata: Max description length is 120 bytes");

        require(mData.royalty[0] + mData.royalty[1] == 100, "Metadata: Sum of royalty splits not 100");
        if (mData.artist == address(0)) {
            require(mData.royalty[1] == 0, "Metadata: Artist royalty split must be 0 with zero address");
        }
        require(mData.rarity > 0, "Metadata: Invalid rarity value");
        require(count > 0, "Metadata: Invalid mint amount");
    }

    function logMetadata(uint256 _id) internal {
        Metadata memory mData = s.metadata[_id];
        emit MetadataActionLog(
            _id,
            s.metadataOwner[_id],
            mData.fileHash,
            mData.name,
            mData.publisher,
            mData.publisherName,
            mData.externalLink,
            mData.description,
            mData.artist,
            mData.artistName,
            mData.royalty,
            mData.rarity,
            mData.createdAt,
            mData.status
        );
    }
}
