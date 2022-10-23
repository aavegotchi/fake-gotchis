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
    event MetadataActionLog(uint256 indexed id, Metadata metaData);
    event MetadataFlag(uint256 indexed _id, address _flaggedBy);
    event MetadataLike(uint256 indexed _id, address _likedBy);
    event ReviewPass(uint256 indexed _id, address _reviewer);
    event MetadataDecline(uint256 indexed _id, address _declinedBy);

    function getMetadata(uint256 _id) external view returns (Metadata memory) {
        validateMetadata(_id);
        return s.metadata[_id];
    }

    struct MetadataInput {
        string name;
        string publisherName;
        string externalLink;
        string description;
        address artist;
        string artistName;
        uint16[2] royalty; // royalty[0]: publisher, royalty[1]: artist, sum should be 400 (4%)
        uint16 editions;
        string fileHash;
        string fileType;
        string thumbnailHash;
        string thumbnailType;
    }

    function addMetadata(MetadataInput memory mData, uint256 series) external {
        address _sender = LibMeta.msgSender();
        // check blocked
        require(!s.blocked[_sender], "Metadata: Blocked address");

        // Parameter validation
        verifyMetadata(mData);

        if (bytes(s.publisherToName[_sender]).length == 0) {
            require(s.nameToPublisher[mData.publisherName] == address(0), "Metadata: Publisher name already used");
            s.publisherToName[_sender] = mData.publisherName;
            s.nameToPublisher[mData.publisherName] = _sender;
        } else {
            require(s.nameToPublisher[mData.publisherName] == _sender, "Metadata: Invalid publisher name");
        }

        // Burn card
        IFakeGotchisCardDiamond(s.fakeGotchisCardDiamond).burn(_sender, series, 1);

        // save
        s.metadataIdCounter++;
        uint256 _metadataId = s.metadataIdCounter;
        s.metadata[_metadataId] = Metadata({
            name: mData.name,
            description: mData.description,
            externalLink: mData.externalLink,
            editions: mData.editions,
            publisher: _sender,
            publisherName: mData.publisherName,
            artist: mData.artist,
            artistName: mData.artistName,
            royalty: mData.royalty,
            fileHash: mData.fileHash,
            fileType: mData.fileType,
            thumbnailHash: mData.thumbnailHash,
            thumbnailType: mData.thumbnailType,
            minted: false,
            createdAt: uint40(block.timestamp),
            status: METADATA_STATUS_PENDING,
            flagCount: 0,
            likeCount: 0
        });

        s.ownerMetadataIdIndexes[_sender][_metadataId] = s.ownerMetadataIds[_sender].length;
        s.ownerMetadataIds[_sender].push(_metadataId);
        s.metadataIds.push(_metadataId);
        s.metadataOwner[_metadataId] = _sender;

        // emit event with metadata
        emit MetadataActionLog(_metadataId, s.metadata[_metadataId]);
    }

    function declineMetadata(uint256 _id, bool isBadFaith) external onlyOwner {
        validateMetadata(_id);
        require(s.metadata[_id].status != METADATA_STATUS_APPROVED, "Metadata: Already approved");

        s.metadata[_id].status = METADATA_STATUS_DECLINED;
        if (isBadFaith) {
            s.blocked[s.metadataOwner[_id]] = true;
        }

        // emit event with metadata
        emit MetadataActionLog(_id, s.metadata[_id]);
        emit MetadataDecline(_id, msg.sender);
    }

    function unblockSender(address _address) external onlyOwner {
        s.blocked[_address] = false;
    }

    function mint(uint256 _id) external {
        Metadata memory mData = s.metadata[_id];
        require(mData.status != METADATA_STATUS_DECLINED, "Metadata: Declined");
        require(mData.status != METADATA_STATUS_PAUSED, "Metadata: Paused for review");

        require(!mData.minted, "Metadata: Already minted");

        if (mData.status == METADATA_STATUS_PENDING) {
            require(mData.createdAt + 5 days <= block.timestamp, "Metadata: Still pending");
            s.metadata[_id].status = METADATA_STATUS_APPROVED;
            // emit event with metadata
            emit MetadataActionLog(_id, s.metadata[_id]);
        }

        LibERC721.safeBatchMint(mData.publisher, _id, mData.editions);
        s.metadata[_id].minted = true;
    }

    function verifyMetadata(MetadataInput memory mData) internal pure {
        require(bytes(mData.fileHash).length > 0, "Metadata: File hash should exist");
        require(bytes(mData.fileType).length > 0, "Metadata: File type should exist");
        require(mData.artist != address(0), "Metadata: Artist should exist");
        require(bytes(mData.fileType).length <= 20, "Metadata: Max file type length is 20 bytes");
        require(bytes(mData.name).length > 0, "Metadata: Name should exist");
        require(bytes(mData.name).length <= 50, "Metadata: Max name length is 50 bytes");
        require(bytes(mData.description).length > 0, "Metadata: Description should exist");
        require(bytes(mData.description).length <= 120, "Metadata: Max description length is 120 bytes");
        require(bytes(mData.externalLink).length <= 50, "Metadata: Max external link length is 50 bytes");
        require(bytes(mData.publisherName).length > 0, "Metadata: Publisher name should exist");
        require(bytes(mData.publisherName).length <= 30, "Metadata: Max publisher name length is 30 bytes");
        require(bytes(mData.artistName).length > 0, "Metadata: Artist name should exist");
        require(bytes(mData.artistName).length <= 30, "Metadata: Max artist name length is 30 bytes");
        if (bytes(mData.thumbnailHash).length > 0) {
            require(bytes(mData.thumbnailType).length > 0, "Metadata: Thumbnail type should exist");
            require(bytes(mData.thumbnailType).length <= 20, "Metadata: Max thumbnail type length is 20 bytes");
        } else {
            require(bytes(mData.thumbnailType).length <= 0, "Metadata: Thumbnail type should not exist");
        }

        require(mData.royalty[0] + mData.royalty[1] == 400, "Metadata: Sum of royalty splits not 400");
        if (mData.artist == address(0)) {
            require(mData.royalty[1] == 0, "Metadata: Artist royalty split must be 0 with zero address");
        }
        require(mData.editions > 0, "Metadata: Invalid editions value");
        require(mData.editions <= 100, "Metadata: Max editions value is 100");
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

        emit MetadataFlag(_id, _sender);
    }

    function passReview(uint256 _id) external onlyOwner {
        validateMetadata(_id);

        require(s.metadata[_id].status == METADATA_STATUS_PAUSED, "Metadata: Not paused");

        s.metadata[_id].status = METADATA_STATUS_PENDING;

        // emit event with metadata
        emit MetadataActionLog(_id, s.metadata[_id]);

        emit ReviewPass(_id, msg.sender);
    }

    function like(uint256 _id) external {
        validateMetadata(_id);

        address _sender = LibMeta.msgSender();

        checkForActions(_sender);

        require(!s.metadataLiked[_id][_sender], "MetadataFacet: Already liked");
        s.metadata[_id].likeCount++;
        s.metadataLiked[_id][_sender] = true;

        emit MetadataLike(_id, _sender);
    }
}
