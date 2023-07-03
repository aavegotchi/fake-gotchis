// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Modifiers, Metadata} from "../../libraries/AppStorage.sol";
import {LibERC721} from "../../libraries/LibERC721.sol";

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
        LibERC721.safeMint(_toAddress, _tokenId);
    }

    function setFakeGotchiMetadata(uint _id, Metadata memory _fakegotchi) external onlyLayerZeroBridge {
        s.metadata[_id] = _fakegotchi;
    }

    function getFakeGotchiData(uint256 _tokenId) external view returns (Metadata memory fakegotchi_) {
        fakegotchi_ = s.metadata[_tokenId];
    }
}
