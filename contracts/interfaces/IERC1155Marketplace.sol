// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC1155Marketplace {
    function updateERC1155Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        address _owner
    ) external;
}
