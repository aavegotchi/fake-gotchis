// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibERC721.sol";

contract FakeGotchiCardPolygonXGotchichainBridgeFacet is Modifiers {
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
        Metadata memory mData = s.metadata[_tokenId];
        if (mData.status == METADATA_STATUS_PENDING) {
            s.metadata[_tokenId].status = METADATA_STATUS_APPROVED;
            // emit event with metadata
            // emit MetadataActionLog(_id, s.metadata[_id]);
        }

        LibERC721.safeMint(_toAddress, _tokenId);
        s.metadata[_tokenId].minted = true;
    }

    function setAavegotchiMetadata(uint _id, Metadata memory _aavegotchi) external onlyLayerZeroBridge {
        s.metadata[_id] = _aavegotchi;
    }

    function getFakeGotchiData(uint256 _tokenId) external view returns (Metadata memory aavegotchi_) {
        aavegotchi_ = s.metadata[_tokenId];
    }
}
