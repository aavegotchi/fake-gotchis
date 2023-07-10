// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/AppStorageCard.sol";
import "../../libraries/LibERC1155.sol";

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

    function mintWithId(address _toAddress, uint _tokenId, uint _amount) external onlyLayerZeroBridge {
        s.maxCards[_tokenId] = s.maxCards[_tokenId] + _amount;
        LibERC1155._mint(_toAddress, _tokenId, _amount, new bytes(0));
        if (_tokenId >= s.nextCardId) { //TODO be careful if minting on gotchichain
            s.nextCardId = _tokenId + 1;
        }
    }
}
