// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/AppStorageCard.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC1155.sol";
import "../../interfaces/IERC1155Marketplace.sol";

contract FakeGotchisCardFacet is Modifiers {
    event NewSeriesStarted(uint256 indexed id, uint256 indexed amount);
    event AavegotchiAddressUpdated(address _aavegotchiDiamond);
    event FakeGotchisNftAddressUpdated(address _fakeGotchisNftDiamond);

    function setAavegotchiAddress(address _aavegotchiDiamond) external onlyOwner {
        s.aavegotchiDiamond = _aavegotchiDiamond;
        emit AavegotchiAddressUpdated(_aavegotchiDiamond);
    }

    function setFakeGotchisNftAddress(address _fakeGotchisNftDiamond) external onlyOwner {
        s.fakeGotchisNftDiamond = _fakeGotchisNftDiamond;
        emit FakeGotchisNftAddressUpdated(_fakeGotchisNftDiamond);
    }

    /**
     * @notice Start new card series with minting ERC1155 Cards to this
     * @param _amount Amount to mint in this series
     */
    function startNewSeries(uint256 _amount) external onlyOwner {
        require(_amount > 0, "FGCard: Max amount must be greater than 0");
        uint256 newCardId = s.nextCardId;
        s.maxCards[newCardId] = _amount;
        LibERC1155._mint(LibMeta.msgSender(), newCardId, _amount, new bytes(0));
        s.nextCardId = newCardId + 1;

        emit NewSeriesStarted(newCardId, _amount);
    }

    /**
     * @notice Query if an address is an authorized operator for another address
     * @param _owner The address that owns the NFTs
     * @param _operator The address that acts on behalf of the owner
     * @return approved_ True if `_operator` is an approved operator for `_owner`, false otherwise
     */
    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
        approved_ = s.operators[_owner][_operator];
    }

    /**
     * @notice Enable or disable approval for a third party ("operator") to manage all of `msg.sender`'s assets
     * @dev Emits the ApprovalForAll event. The contract MUST allow multiple operators per owner.
     * @param _operator Address to add to the set of authorized operators
     * @param _approved True if the operator is approved, false to revoke approval
     */
    function setApprovalForAll(address _operator, bool _approved) external {
        address sender = LibMeta.msgSender();
        require(sender != _operator, "FGCard: setting approval status for self");
        s.operators[sender][_operator] = _approved;
        emit LibERC1155.ApprovalForAll(sender, _operator, _approved);
    }

    function burn(
        address _cardOwner,
        uint256 _cardSeriesId,
        uint256 _amount
    ) external onlyNftDiamond {
        // TODO: check new series started, check s.nextCardId > 0
        // burn card
        LibERC1155._burn(_cardOwner, _cardSeriesId, _amount);
    }

    /**
     * @notice Transfers `_amount` of an `_id` from the `_from` address to the `_to` address specified (with safety call).
     * @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
     * Must contain scenario of internal _safeTransferFrom() function
     * @param _from    Source address
     * @param _to      Target address
     * @param _id      ID of the token type
     * @param _amount  Transfer amount
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes calldata _data
    ) external {
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender] || sender == address(this), "FGCard: Not owner and not approved to transfer");
        _safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /**
     * @notice Transfers `_amounts` of `_ids` from the `_from` address to the `_to` address specified (with safety call).
     * @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
     * Must contain scenario of internal _safeBatchTransferFrom() function
     * @param _from    Source address
     * @param _to      Target address
     * @param _ids     IDs of each token type (order and length must match _amounts array)
     * @param _amounts Transfer amounts per token type (order and length must match _ids array)
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external {
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "FGCard: Not owner and not approved to transfer");
        _safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    /**
     * @notice Transfers `_amount` of an `_id` from the `_from` address to the `_to` address specified (with safety call).
     * @dev
     * MUST revert if `_to` is the zero address.
     * MUST revert if balance of holder for token `_id` is lower than the `_amount` sent.
     * MUST revert on any other error.
     * MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
     * After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
     * @param _from    Source address
     * @param _to      Target address
     * @param _id      ID of the token type
     * @param _amount  Transfer amount
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
     */
    function _safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes calldata _data
    ) internal {
        require(_to != address(0), "FGCard: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        uint256 bal = s.cards[_from][_id];
        require(_amount <= bal, "FGCard: Doesn't have that many to transfer");
        s.cards[_from][_id] = bal - _amount;
        s.cards[_to][_id] += _amount;
        // Update baazaar listing
        if (s.aavegotchiDiamond != address(0)) {
            IERC1155Marketplace(s.aavegotchiDiamond).updateERC1155Listing(address(this), _id, _from);
        }
        emit LibERC1155.TransferSingle(sender, _from, _to, _id, _amount);
        LibERC1155.onERC1155Received(sender, _from, _to, _id, _amount, _data);
    }

    /**
     * @notice Transfers `_amounts` of `_ids` from the `_from` address to the `_to` address specified (with safety call).
     * @dev
     * MUST revert if `_to` is the zero address.
     * MUST revert if length of `_ids` is not the same as length of `_amounts`.
     * MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the `_amounts` sent to the recipient.
     * MUST revert on any other error.     *
     * MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
     * Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_amounts[0] before _ids[1]/_amounts[1], etc).
     * After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
     * @param _from    Source address
     * @param _to      Target address
     * @param _ids     IDs of each token type (order and length must match _amounts array)
     * @param _amounts Transfer amounts per token type (order and length must match _ids array)
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
     */
    function _safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) internal {
        require(_ids.length == _amounts.length, "FGCard: ids not same length as amounts");
        require(_to != address(0), "FGCard: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 bal = s.cards[_from][id];
            require(_amounts[i] <= bal, "FGCard: Doesn't have that many to transfer");
            s.cards[_from][id] = bal - _amounts[i];
            s.cards[_to][id] += _amounts[i];
            // Update baazaar listing
            if (s.aavegotchiDiamond != address(0)) {
                IERC1155Marketplace(s.aavegotchiDiamond).updateERC1155Listing(address(this), id, _from);
            }
        }
        emit LibERC1155.TransferBatch(sender, _from, _to, _ids, _amounts);
        LibERC1155.onERC1155BatchReceived(sender, _from, _to, _ids, _amounts, _data);
    }

    /**
     * @notice Get the URI for a card type
     * @return URI for token type
     */
    function uri(uint256 _id) external view returns (string memory) {
        require(_id < s.nextCardId, "FGCard: Card _id not found");
        return LibStrings.strWithUint(s.cardBaseUri, _id);
    }

    /**
     * @notice Set the base url for all card types
     * @param _uri The new base url
     */
    function setBaseURI(string calldata _uri) external onlyOwner {
        s.cardBaseUri = _uri;
        for (uint256 i; i < s.nextCardId; i++) {
            emit LibERC1155.URI(LibStrings.strWithUint(_uri, i), i);
        }
    }

    /**
     * @notice Get the balance of an account's tokens.
     * @param _owner  The address of the token holder
     * @param _id     ID of the token
     * @return bal_   The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_) {
        bal_ = s.cards[_owner][_id];
    }

    /**
     * @notice Get the balance of multiple account/token pairs
     * @param _owners The addresses of the token holders
     * @param _ids    ID of the tokens
     * @return bals   The _owner's balance of the token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        require(_owners.length == _ids.length, "FGCard: _owners length not same as _ids length");
        bals = new uint256[](_owners.length);
        for (uint256 i; i < _owners.length; i++) {
            uint256 id = _ids[i];
            address owner = _owners[i];
            bals[i] = s.cards[owner][id];
        }
    }

    /**
        @notice Handle the receipt of a single ERC1155 token type.
        @dev An ERC1155-compliant smart contract MUST call this function on the token recipient contract, at the end of a `safeTransferFrom` after the balance has been updated.
        This function MUST return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61) if it accepts the transfer.
        This function MUST revert if it rejects the transfer.
        Return of any other value than the prescribed keccak256 generated value MUST result in the transaction being reverted by the caller.
        @return           `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
    */
    function onERC1155Received(
        address, /*_operator*/
        address, /*_from*/
        uint256, /*_id*/
        uint256, /*_value*/
        bytes calldata /*_data*/
    ) external pure returns (bytes4) {
        return LibERC1155.ERC1155_ACCEPTED;
    }
}
