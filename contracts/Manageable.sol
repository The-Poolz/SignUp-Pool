// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "poolz-helper/contracts/ERC20Helper.sol";
import "poolz-helper/contracts/ERC721Helper.sol";
import "poolz-helper/contracts/ETHHelper.sol";
import "poolz-helper/contracts/GovManager.sol";
import "openzeppelin-solidity/contracts/utils/Pausable.sol";

contract Manageable is
    ETHHelper,
    ERC20Helper,
    GovManager,
    Pausable,
    ERC721Helper
{
    struct Pool {
        address payable Owner; // The pool owner or admin
        address FeeToken; // Which token will be used
        uint256 Fee; // The pool fee
        uint256 Reserve; // Reserve of fee
    }

    Pool public Admin;

    constructor() public {
        Admin.Owner = payable(owner());
    }

    function setFee(address _token, uint256 _amount) external onlyOwnerOrGov {
        Admin.Fee = _amount;
        Admin.FeeToken = _token; // set address(0) to use ETH/BNB as main coin
    }

    function WithdrawFee(address payable _to) external onlyOwnerOrGov {
        WithdrawFee(Admin.FeeToken, _to, Admin.Reserve);
        Admin.Reserve = 0;
    }

    function WithdrawFee(
        address _token,
        address payable _to,
        uint256 _reserve
    ) internal {
        require(_reserve > 0, "Fee amount is zero");
        if (_token == address(0)) {
            _to.transfer(_reserve);
        } else {
            TransferToken(_token, _to, _reserve);
        }
    }

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

    function pause() external onlyOwnerOrGov {
        _pause();
    }

    function unpause() external onlyOwnerOrGov {
        _unpause();
    }
}
