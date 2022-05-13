// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "poolz-helper-v2/contracts/ERC20Helper.sol";
import "poolz-helper-v2/contracts/ERC721Helper.sol";
import "poolz-helper-v2/contracts/ETHHelper.sol";
import "poolz-helper-v2/contracts/GovManager.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Manageable is
    ETHHelper,
    ERC20Helper,
    GovManager,
    Pausable,
    ERC721Helper
{
    uint256 public Fee; // fee to create new pool
    uint256 public WhiteListFee; // fee to activate whitelist
    address public FeeToken;
    uint256 public Reserve;

    function SetFee(address _token, uint256 _amount) external onlyOwnerOrGov {
        SetFeeToken(_token);
        Fee = _amount;
    }

    function SetWhiteListFee(uint256 _amount) external onlyOwnerOrGov {
        WhiteListFee = _amount;
    }

    function SetFeeToken(address _token) public onlyOwnerOrGov {
        if (Reserve > 0) {
            WithdrawFee(payable(msg.sender)); // If the admin tries to set a new token without withrowing the old one
        }
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

    function Pause() external onlyOwnerOrGov {
        _pause();
    }

    function Unpause() external onlyOwnerOrGov {
        _unpause();
    }
}
