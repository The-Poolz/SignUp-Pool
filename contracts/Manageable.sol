// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "poolz-helper/contracts/ERC20Helper.sol";
import "poolz-helper/contracts/ETHHelper.sol";
import "poolz-helper/contracts/GovManager.sol";
import "openzeppelin-solidity/contracts/utils/Pausable.sol";

contract Manageable is ETHHelper, ERC20Helper, GovManager, Pausable {

    uint256 public Fee;
    address public FeeTokenAddress;

    function setEthFee(uint256 _amount) external onlyOwnerOrGov {
        Fee = _amount;
        FeeTokenAddress = address(0);
    }

    function setERC20Fee(address _token, uint256 _amount) external onlyOwnerOrGov {
        Fee = _amount;
        FeeTokenAddress = _token;
    }

    function WithdrawETHFee(address payable _to) external onlyOwner {
        _to.transfer(address(this).balance);
    }

    function WithdrawERC20Fee(address _to) external onlyOwner {
        uint256 bal = CheckBalance(FeeTokenAddress, address(this));
        TransferToken(FeeTokenAddress, _to, bal);
    }

    function pause() external onlyOwnerOrGov {
        _pause();
    }

    function unpause() external onlyOwnerOrGov {
        _unpause();
    }
}