// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Modifiers, Metadata, LibAppStorage, AppStorage} from "../../libraries/AppStorage.sol";
import "../../libraries/LibERC721.sol";


contract FakeGotchiPolygonXGotchichainBridgeFacet is Modifiers {

    address public layerZeroBridge;

    modifier onlyLayerZeroBridge() {
        require(msg.sender == layerZeroBridge, "TilesPolygonXGotchichainBridgeFacet: Only layerzero bridge");
        _;
    }

    function setLayerZeroBridge(address _newLayerZeroBridge) external onlyOwner {
        // todo check only dao or owner
        layerZeroBridge = _newLayerZeroBridge;
    }

    function mintWithId(address _toAddress, uint _tokenId) external onlyLayerZeroBridge {
        AppStorage storage s = LibAppStorage.diamondStorage();

        require(s.fakeGotchiOwner[_tokenId] == address(0), "FakeGotchiPolygonXGotchichainBridgeFacet: tokenId already minted");

        s.fakeGotchiOwner[_tokenId] = _toAddress;
        s.tokenIds.push(_tokenId);
        s.ownerTokenIdIndexes[_toAddress][_tokenId] = s.ownerTokenIds[_toAddress].length;
        s.ownerTokenIds[_toAddress].push(_tokenId);
        s.tokenIdCounter = _tokenId + 1;

        emit LibERC721.Mint(_toAddress, _tokenId);
        emit LibERC721.Transfer(address(0), _toAddress, _tokenId);
    }

    function setFakeGotchiMetadata(uint _id, Metadata memory _fakegotchi, uint256 metadataId) external onlyLayerZeroBridge {
        s.metadata[_id] = _fakegotchi;
        s.fakeGotchis[_id] = metadataId;
    }

    function getFakeGotchiData(uint256 _tokenId) external view returns (Metadata memory fakegotchi_) {
        fakegotchi_ = s.metadata[_tokenId];
    }

    function getMetadataId(uint256 _tokenId) external view returns (uint256 metadataId_) {
        metadataId_ = s.fakeGotchis[_tokenId];
    }
}
