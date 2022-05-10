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
    uint256 public Fee;
    address public FeeToken;
    uint256 public Reserve;

    function setFee(address _token, uint256 _amount) external onlyOwnerOrGov {
        if (Reserve > 0) {
            WithdrawFee(msg.sender); // If the admin tries to set a new token without withrowing the old one
        }
        Fee = _amount;
        FeeToken = _token; // set address(0) to use ETH/BNB as main coin
    }

    function WithdrawFee(address payable _to) public onlyOwnerOrGov {
        WithdrawFee(FeeToken, _to, Reserve);
        Reserve = 0;
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
