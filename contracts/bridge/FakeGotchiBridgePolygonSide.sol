// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ProxyONFT721} from "./ProxyONFT721.sol";
import {FakeGotchiPolygonXGotchichainBridgeFacet} from "../FakeGotchisNFTDiamond/facets/PolygonXGotchichainBridgeFacet.sol";
import {Metadata} from "../libraries/AppStorage.sol";

contract FakeGotchiBridgePolygonSide is ProxyONFT721 {
    constructor(uint256 _minGasToTransfer, address _lzEndpoint, address _proxyToken) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {}

    function estimateSendBatchFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        bool _useZro,
        bytes memory _adapterParams
    ) public view override returns (uint nativeFee, uint zroFee) {
        Metadata[] memory fakegotchis = new Metadata[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            fakegotchis[i] = FakeGotchiPolygonXGotchichainBridgeFacet(address(token)).getFakeGotchiData(_tokenIds[i]);
        }
        bytes memory payload = abi.encode(_toAddress, _tokenIds, fakegotchis);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function _send(
        address _from,
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) internal override {
        // allow 1 by default
        require(_tokenIds.length > 0, "LzApp: tokenIds[] is empty");
        require(_tokenIds.length == 1 || _tokenIds.length <= dstChainIdToBatchLimit[_dstChainId], "ONFT721: batch size exceeds dst batch limit");

        Metadata[] memory fakegotchis = new Metadata[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            _debitFrom(_from, _dstChainId, _toAddress, _tokenIds[i]);
            fakegotchis[i] = FakeGotchiPolygonXGotchichainBridgeFacet(address(token)).getFakeGotchiData(_tokenIds[i]);
        }

        bytes memory payload = abi.encode(_toAddress, _tokenIds, fakegotchis);

        _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, dstChainIdToTransferGas[_dstChainId] * _tokenIds.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds);
    }

    function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint64 /*_nonce*/, bytes memory _payload) internal virtual override {
        // decode and load the toAddress
        (bytes memory toAddressBytes, uint[] memory tokenIds, Metadata[] memory fakegotchis) = abi.decode(_payload, (bytes, uint[], Metadata[]));

        address toAddress;
        assembly {
            toAddress := mload(add(toAddressBytes, 20))
        }
        uint nextIndex = _creditTill(_srcChainId, toAddress, 0, tokenIds);
        if (nextIndex < tokenIds.length) {
            // not enough gas to complete transfers, store to be cleared in another tx
            bytes32 hashedPayload = keccak256(_payload);
            storedCredits[hashedPayload] = StoredCredit(_srcChainId, toAddress, nextIndex, true);
            emit CreditStored(hashedPayload, _payload);
        }

        _updateFakeGotchiMetadata(tokenIds, fakegotchis);

        emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, tokenIds);
    }

    function _creditTo(uint16, address _toAddress, uint _tokenId) internal override {
        address owner = token.ownerOf(_tokenId);
        if (owner != 0x0000000000000000000000000000000000000000) {
            token.transferFrom(address(this), _toAddress, _tokenId);
        } else {
            FakeGotchiPolygonXGotchichainBridgeFacet(address(token)).mintWithId(_toAddress, _tokenId);
        }
    }

    function _updateFakeGotchiMetadata(uint[] memory tokenIds, Metadata[] memory fakegotchis) internal {
        for (uint i = 0; i < tokenIds.length; i++) {
            FakeGotchiPolygonXGotchichainBridgeFacet(address(token)).setFakeGotchiMetadata(tokenIds[i], fakegotchis[i]);
        }
    }
}
