// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "poolz-helper/contracts/ERC20Helper.sol";
import "poolz-helper/contracts/ETHHelper.sol";
import "poolz-helper/contracts/GovManager.sol";
import "openzeppelin-solidity/contracts/utils/Pausable.sol";

contract Manageable is ETHHelper, ERC20Helper, GovManager, Pausable {

    uint256 public Fee;
    mapping(address => uint256) public FeeMap;

    function SetFee(uint256 _fee) public onlyOwnerOrGov {
        Fee = _fee;
    }

    function WithdrawETHFee(address payable _to) external onlyOwner {
        _to.transfer(address(this).balance);
    }

    function WithdrawERC20Fee(address _tokenAddress, address _to) external onlyOwner {
        uint256 bal = FeeMap[_tokenAddress];
        FeeMap[_tokenAddress] = 0;
        TransferToken(_tokenAddress, _to, bal);
    }

    function pause() external onlyOwnerOrGov {
        _pause();
    }

    function unpause() external onlyOwnerOrGov {
        _unpause();
    }
}