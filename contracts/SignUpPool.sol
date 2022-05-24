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

    modifier isWhiteListExist(IWhiteList _whiteListAddr) {
        require(
            address(_whiteListAddr) != address(0),
            "whiteList is zero address"
        );
        _;
    }

    constructor(IWhiteList _whiteListAddr) isWhiteListExist(_whiteListAddr) {
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
        uint256 feeAmount;
        if (signUpPool.WhiteListId == 0) {
            // if the whitelist is not activated
            feeAmount = signUpPool.BaseFee.Fee();
            signUpPool.BaseFee.PayFee{value: msg.value}(feeAmount);
        } else {
            feeAmount = CalcFee(_poolId);
            if (feeAmount > 0) {
                signUpPool.BaseFee.PayFee{value: msg.value}(feeAmount);
            }
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

    function CalcFee(uint256 _poolId)
        internal
        whiteListStatus(_poolId, true)
        returns (uint256)
    {
        Pool storage signUpPool = poolsMap[_poolId];
        uint256 WhiteListId = signUpPool.WhiteListId;
        uint256 discount = WhiteListAddress.Check(msg.sender, WhiteListId);
        uint256 fee = signUpPool.BaseFee.Fee();
        if (discount >= fee) {
            WhiteListAddress.Register(msg.sender, WhiteListId, fee);
            return 0;
        }
        WhiteListAddress.Register(msg.sender, WhiteListId, discount);
        return fee - discount;
    }
}
