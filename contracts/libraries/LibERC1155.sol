// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC1155TokenReceiver} from "../interfaces/IERC1155TokenReceiver.sol";
import {LibAppStorageCard, CardAppStorage} from "./AppStorageCard.sol";
import "./LibMeta.sol";

library LibERC1155 {
    bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
    /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_id` argument MUST be the token type being transferred.
        The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).        
    */
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).      
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_ids` argument MUST be the list of tokens being transferred.
        The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).                
    */
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

    /**
        @dev MUST emit when approval for a second party/operator address to manage all tokens for an owner address is enabled or disabled (absence of an event assumes disabled).        
    */
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    /**
        @dev MUST emit when the URI is updated for a token ID.
        URIs are defined in RFC 3986.
        The URI MUST point to a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
    */
    event URI(string _value, uint256 indexed _id);

    function onERC1155Received(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes memory _data
    ) internal {
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data),
                "LibERC1155: Transfer rejected/failed by _to"
            );
        }
    }

    function onERC1155BatchReceived(
        address _operator,
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes memory _data
    ) internal {
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data),
                "LibERC1155: Transfer rejected/failed by _to"
            );
        }
    }

    /**
     * @notice Creates `_amount` tokens of token type `_id`, and assigns them to `_to`.
     * MUST revert if `_to` is the zero address.
     * MUST emit the `TransferSingle` event to reflect the balance change.
     * If `_to` refers to a smart contract, it must call `onERC1155Received` and return the acceptance magic value.
     * @param _to      Target address
     * @param _id      ID of the token type
     * @param _amount  Mint amount
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
     */
    function _mint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) internal {
        CardAppStorage storage s = LibAppStorageCard.diamondStorage();
        require(_to != address(0), "FGCard: Can't mint to the zero address");

        address sender = LibMeta.msgSender();
        s.cards[_to][_id] += _amount;
        emit TransferSingle(sender, address(0), _to, _id, _amount);
        onERC1155Received(sender, address(0), _to, _id, _amount, _data);
    }

    /**
     * @notice Create `_amounts` of `_ids` to the `_to` address specified. (Batch operation of _mint)
     * @param _to      Target address
     * @param _ids     IDs of each token type (order and length must match _amounts array)
     * @param _amounts Transfer amounts per token type (order and length must match _ids array)
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
     */
    function _mintBatch(
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) internal {
        CardAppStorage storage s = LibAppStorageCard.diamondStorage();
        require(_to != address(0), "FGCard: Can't mint to 0 address");
        require(_ids.length == _amounts.length, "FGCard: ids not same length as amounts");
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _ids.length; i++) {
            s.cards[_to][_ids[i]] += _amounts[i];
        }
        emit TransferBatch(sender, address(0), _to, _ids, _amounts);
        onERC1155BatchReceived(sender, address(0), _to, _ids, _amounts, _data);
    }

    /**
     * @notice Destroys `amount` tokens of token type `id` from `from`
     * MUST revert if `_from` is the zero address.
     * MUST revert if balance of holder for token `_id` is lower than the `_amount`.
     * MUST emit the `TransferSingle` event to reflect the balance change.
     * @param _from    Source address
     * @param _id      ID of the token type
     * @param _amount  Burn amount
     */
    function _burn(
        address _from,
        uint256 _id,
        uint256 _amount
    ) internal {
        CardAppStorage storage s = LibAppStorageCard.diamondStorage();
        require(_from != address(0), "FGCard: Can't burn from the zero address");
        address sender = LibMeta.msgSender();

        uint256 bal = s.cards[_from][_id];
        require(_amount <= bal, "FGCard: Burn amount exceeds balance");
        s.cards[_from][_id] = bal - _amount;
        emit TransferSingle(sender, _from, address(0), _id, _amount);
    }
}
