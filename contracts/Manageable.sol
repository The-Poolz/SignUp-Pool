// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "poolz-helper-v2/contracts/ERC721Helper.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./FeeHelper.sol";

contract Manageable is FeeHelper, Pausable, ERC721Helper {
    function WithdrawNFT(
        address _token,
        uint256 _tokenId,
        address _to
    ) external onlyOwner {
        TransferNFTOut(_token, _tokenId, _to);
    }

    function ApproveAllNFT(
        address _token,
        address _to,
        bool _approve
    ) external onlyOwner {
        SetApproveForAllNFT(_token, _to, _approve);
    }

    function Pause() external onlyOwnerOrGov {
        _pause();
    }

    function Unpause() external onlyOwnerOrGov {
        _unpause();
    }
}
