// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./PoolControl.sol";

contract SignUpPool is PoolControl {
    event NewSignUp(uint256 PoolId, address UserAddress);
    event NewSignUpNFT(
        uint256 PoolId,
        address UserAddress,
        address TokenAddress,
        uint256 TokenId
    );

    modifier validateSender() {
        require(
            msg.sender == tx.origin && !isContract(msg.sender),
            "Some thing wrong with the msgSender"
        );
        _;
    }

    constructor(IWhiteList _whiteListAddr) {
        WhiteListAddress = _whiteListAddr;
    }

    function SignUp(uint256 _poolId)
        external
        payable
        whenNotPaused
        validateStatus(_poolId, true)
        validateSender
    {
        Pool storage signUpPool = poolsMap[_poolId];
        if (!FreePay(_poolId)) {
            PayFee(signUpPool.FeeToken, signUpPool.Fee);
            signUpPool.Reserve += signUpPool.Fee;
        }
        emit NewSignUp(_poolId, msg.sender);
    }

    function SignUpWithNFT(
        uint256 _poolId,
        address _tokenAddress,
        uint256 _tokenId
    ) external whenNotPaused validateStatus(_poolId, true) validateSender {
        TransferNFTIn(_tokenAddress, _tokenId, msg.sender);
        emit NewSignUpNFT(_poolId, msg.sender, _tokenAddress, _tokenId);
    }

    //@dev use it with  require(msg.sender == tx.origin)
    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function FreePay(uint256 _poolId) internal view returns (bool) {
        uint256 WhiteListId = poolsMap[_poolId].WhiteListId;
        return
            WhiteListId != 0 &&
            WhiteListAddress.Check(msg.sender, WhiteListId) > 0;
    }
}
