// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./PoolControl.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract SignUp is PoolControl {
    event NewSignUp(uint256 PoolId, address UserAddress);

    modifier shouldBeActive(uint256 _poolId) {
        require(isPoolActive(_poolId), "Pool is not Active");
        _;
    }

    modifier validateSender(){
        require(
            msg.sender == tx.origin && !isContract(msg.sender),
            "Some thing wrong with the msgSender"
        );
        _;
    }

    function SignUpETH(uint256 _poolId) external payable whenNotPaused shouldBeActive(_poolId) validateSender() {
        require(msg.value >= Fee, "Not Enough Fee Provided");
        emit NewSignUp(_poolId, msg.sender);
    }

    function SignUpERC20(uint _poolId, address _tokenAddress) external whenNotPaused shouldBeActive(_poolId) validateSender() {
        if(Fee > 0){
            TransferInToken(_tokenAddress, msg.sender, Fee);
        }
        FeeMap[_tokenAddress] = SafeMath.add(FeeMap[_tokenAddress], Fee);
        emit NewSignUp(_poolId, msg.sender);
    }

    //@dev use it with  require(msg.sender == tx.origin)
    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}