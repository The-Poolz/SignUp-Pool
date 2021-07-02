// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./PoolControl.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract SignUpPool is PoolControl {
    event NewSignUp(uint256 PoolId, address UserAddress);

    modifier shouldBeActive(uint256 _poolId) {
        require(isPoolActive[_poolId], "Pool is not Active or Created");
        _;
    }

    modifier validateSender(){
        require(
            msg.sender == tx.origin && !isContract(msg.sender),
            "Some thing wrong with the msgSender"
        );
        _;
    }

    function SignUp(uint256 _poolId) external payable whenNotPaused shouldBeActive(_poolId) validateSender() {
        if(FeeTokenAddress == address(0)){
            SignUpETH(_poolId);
        } else {
            SignUpERC20(_poolId);
        }
    }

    function SignUpETH(uint256 _poolId) internal {
        require(msg.value >= Fee, "Not Enough Fee Provided");
        emit NewSignUp(_poolId, msg.sender);
    }

    function SignUpERC20(uint _poolId) internal {
        if(Fee > 0){
            TransferInToken(FeeTokenAddress, msg.sender, Fee);
        }
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