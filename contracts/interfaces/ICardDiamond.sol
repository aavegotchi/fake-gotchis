// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICardDiamond {
    function burn(address _cardOwner, uint256 _amount) external;
}
