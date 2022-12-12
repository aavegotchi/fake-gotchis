// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAavegotchiDiamond {
    function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_);

    function isAavegotchiLent(uint32 _tokenId) external view returns (bool);
}
