// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./ProxyONFT1155.sol";
import "../FakeGotchisCardDiamond/facets/PolygonXGotchichainBridgeFacet.sol";

contract FakeGotchiCardBridgeGotchichainSide is ProxyONFT1155 {
    constructor(address _lzEndpoint, address _proxyToken) ProxyONFT1155(_lzEndpoint, _proxyToken) {}

    function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        require(_from == _msgSender(), "ItemsBridgePolygonSide: owner is not send caller");
        for (uint i = 0; i < _tokenIds.length; i++) {
            IERC1155(address(token)).safeTransferFrom(_from, address(this), _tokenIds[i], _amounts[i], "");
        }
    }

    function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        for (uint i = 0; i < _tokenIds.length; i++) {
            uint256 balance = token.balanceOf(address(this), _tokenIds[i]);
            if (balance != 0) {
                // TODO: check if this enough
                token.safeTransferFrom(address(this), _toAddress, _tokenIds[i], _amounts[i], "");
            } else {
                FakeGotchiCardPolygonXGotchichainBridgeFacet(address(token)).mintWithId(_toAddress, _tokenIds[i], _amounts[i]);
            }
        }
    }
}
