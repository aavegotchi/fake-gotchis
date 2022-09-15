// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../interfaces/IFakeGotchisCardDiamond.sol";
import "../../interfaces/IERC20.sol";
import "../../interfaces/IERC721.sol";
import "../../interfaces/IERC1155.sol";

contract MetadataFacet is Modifiers {
    event MetadataActionLog(
        uint256 indexed id,
        address indexed sender,
        string fileHash,
        string name,
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
    event MetadataFlagged(uint256 indexed _id, address _flaggedBy);
    event MetadataLiked(uint256 indexed _id, address _likedBy);
    event ReviewPassed(uint256 indexed _id, address _reviewer);

    function getMetadata(uint256 _id) external view returns (Metadata memory) {
        validateMetadata(_id);
        return s.metadata[_id];
    }

    struct MetadataInput {
        string fileHash;
        string name;
        address publisher;
        string publisherName;
        string externalLink;
        string description;
        address artist;
        string artistName;
        uint256[2] royalty; // royalty[0]: publisher, royalty[1]: artist, sum should be 10000 (100%)
        uint256 rarity;
    }

    function addMetadata(MetadataInput memory mData, uint256 series, uint256 count) external {
        address _sender = LibMeta.msgSender();
        // check blocked
        require(!s.blocked[_sender], "Metadata: Blocked address");

        // Parameter validation
        verifyMetadata(mData, count);

        // Burn card
        IFakeGotchisCardDiamond(s.fakeGotchisCardDiamond).burn(_sender, series, count);

        // save
        s.metadataIdCounter++;
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
            status: METADATA_STATUS_PENDING,
            flagCount: 0,
            likeCount: 0
        });

        s.ownerMetadataIdIndexes[_sender][_metadataId] = s.ownerMetadataIds[_sender].length;
        s.ownerMetadataIds[_sender].push(_metadataId);
        s.metadataIds.push(_metadataId);
        s.metadataOwner[_metadataId] = _sender;

        // emit event with metadata input
        logMetadata(_metadataId);
    }

    function declineMetadata(uint256 _id, bool isBadFaith) external onlyOwner {
        validateMetadata(_id);
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
        require(mData.status != METADATA_STATUS_DECLINED, "Metadata: Declined");
        require(mData.status != METADATA_STATUS_PAUSED, "Metadata: Paused for review");
        if (mData.status == METADATA_STATUS_PENDING) {
            require(mData.createdAt + 5 days <= block.timestamp, "Metadata: Still pending");
            s.metadata[_id].status = METADATA_STATUS_APPROVED;
            // emit event with metadata input
            logMetadata(_id);
        }
        require(mData.count != 0, "Metadata: Already mint");
        LibERC721.safeBatchMint(mData.publisher, _id, mData.count);
        s.metadata[_id].count = 0;
    }

    function verifyMetadata(MetadataInput memory mData, uint256 count) internal pure {
        require(mData.publisher != address(0), "Metadata: Publisher cannot be zero address");
        require(bytes(mData.fileHash).length > 0, "Metadata: File hash should exist");
        require(bytes(mData.description).length <= 120, "Metadata: Max description length is 120 bytes");

        require(mData.royalty[0] + mData.royalty[1] == 10000, "Metadata: Sum of royalty splits not 10000");
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

    function validateMetadata(uint256 _id) internal view {
        require((_id > 0) && (_id <= s.metadataIdCounter), "Metadata: Invalid metadata id");
    }

    function checkForActions(address _sender) internal view {
        uint256 cardSeries; // TODO: Think for the next card series
        require(
            (IERC1155(s.fakeGotchisCardDiamond).balanceOf(_sender, cardSeries) > 0) || // Fake gotchi card owner
            (s.ownerTokenIds[_sender].length > 0) || // Fake gotchi owner
            (IERC721(s.aavegotchiDiamond).balanceOf(_sender) > 0) || // Aavegotchi owner
            (IERC20(s.ghstContract).balanceOf(_sender) >= 1e20), // 100+ GHST holder
            "MetadataFacet: Should own a Fake Gotchi NFT or an aavegotchi or 100 GHST"
        );
    }

    function flag(uint256 _id) external {
        validateMetadata(_id);

        address _sender = LibMeta.msgSender();

        checkForActions(_sender);

        // can only flag if in queue
        require(s.metadata[_id].status == METADATA_STATUS_PENDING, "MetadataFacet: Can only flag in queue");
        require(!s.metadataFlagged[_id][_sender], "MetadataFacet: Already flagged");

        s.metadata[_id].flagCount++;
        s.metadataFlagged[_id][_sender] = true;

        // pause after 10 flags
        if (s.metadata[_id].flagCount == 10) {
            s.metadata[_id].status = METADATA_STATUS_PAUSED;
        }

        emit MetadataFlagged(_id, _sender);
    }

    function passReview(uint256 _id) external onlyOwner {
        validateMetadata(_id);

        require(s.metadata[_id].status == METADATA_STATUS_PAUSED, "Metadata: Not paused");

        s.metadata[_id].status = METADATA_STATUS_PENDING;

        // emit event with metadata input
        logMetadata(_id);

        emit ReviewPassed(_id, msg.sender);
    }

    function like(uint256 _id) external {
        validateMetadata(_id);

        address _sender = LibMeta.msgSender();

        checkForActions(_sender);

        require(!s.metadataLiked[_id][_sender], "MetadataFacet: Already liked");
        s.metadata[_id].likeCount++;
        s.metadataLiked[_id][_sender] = true;

        emit MetadataLiked(_id, _sender);
    }
}
