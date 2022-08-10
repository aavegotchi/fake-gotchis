// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC721TokenReceiver.sol";
import {LibAppStorage, AppStorage} from "./AppStorage.sol";
import "./LibMeta.sol";

library LibERC721 {
    /// @dev This emits when ownership of any NFT changes by any mechanism.
    ///  This event emits when NFTs are created (`from` == 0) and destroyed
    ///  (`to` == 0). Exception: during contract creation, any number of NFTs
    ///  may be created and assigned without emitting Transfer. At the time of
    ///  any transfer, the approved address for that NFT (if any) is reset to none.
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;

    event Mint(address indexed _owner, uint256 indexed _tokenId);

    function checkOnERC721Received(
        address _operator,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC721_RECEIVED == IERC721TokenReceiver(_to).onERC721Received(_operator, _from, _tokenId, _data),
                "LibERC721: Transfer rejected/failed by _to"
            );
        }
    }

    // This function is used by transfer functions
    function transferFrom(
        address _sender,
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(_to != address(0), "ERC721: Can't transfer to 0 address");
        address owner = s.fakeGotchiOwner[_tokenId];
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(_sender == owner || s.operators[owner][_sender] || s.approved[_tokenId] == _sender, "LibERC721: Not owner or approved to transfer");
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        s.fakeGotchiOwner[_tokenId] = _to;

        //Update indexes and arrays

        //Get the index of the tokenID to transfer
        uint256 transferIndex = s.ownerTokenIdIndexes[_from][_tokenId];

        uint256 lastIndex = s.ownerTokenIds[_from].length - 1;
        uint256 lastTokenId = s.ownerTokenIds[_from][lastIndex];
        uint256 newIndex = s.ownerTokenIds[_to].length;

        //Move the last element of the ownerIds array to replace the tokenId to be transferred
        s.ownerTokenIdIndexes[_from][lastTokenId] = transferIndex;
        s.ownerTokenIds[_from][transferIndex] = lastTokenId;
        delete s.ownerTokenIdIndexes[_from][_tokenId];

        //pop from array
        s.ownerTokenIds[_from].pop();

        //update index of new token
        s.ownerTokenIdIndexes[_to][_tokenId] = newIndex;
        s.ownerTokenIds[_to].push(_tokenId);

        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit Approval(owner, address(0), _tokenId);
        }

        emit Transfer(_from, _to, _tokenId);
    }

    function safeBatchMint(
        address _to,
        uint256 _metadataId,
        uint256 _count
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 _tokenId = s.tokenIdCounter;
        for (uint256 i; i < _count; i++) {
            require(s.fakeGotchiOwner[_tokenId] == address(0), "LibERC721: tokenId already minted");

            s.fakeGotchis[_tokenId] = _metadataId;
            s.fakeGotchiOwner[_tokenId] = _to;
            s.tokenIds.push(_tokenId);
            s.ownerTokenIdIndexes[_to][_tokenId] = s.ownerTokenIds[_to].length;
            s.ownerTokenIds[_to].push(_tokenId);

            emit Mint(_to, _tokenId);
            emit Transfer(address(0), _to, _tokenId);

            _tokenId = _tokenId + 1;
        }
        s.tokenIdCounter = _tokenId;
    }

    function safeMint(address _to, uint256 _metadataId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 _tokenId = s.tokenIdCounter;
        require(s.fakeGotchiOwner[_tokenId] == address(0), "LibERC721: tokenId already minted");

        s.fakeGotchis[_tokenId] = _metadataId;
        s.fakeGotchiOwner[_tokenId] = _to;
        s.tokenIds.push(_tokenId);
        s.ownerTokenIdIndexes[_to][_tokenId] = s.ownerTokenIds[_to].length;
        s.ownerTokenIds[_to].push(_tokenId);
        s.tokenIdCounter = _tokenId + 1;

        emit Mint(_to, _tokenId);
        emit Transfer(address(0), _to, _tokenId);
    }
}
