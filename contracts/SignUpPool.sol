// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./PoolControl.sol";

contract SignUpPool is PoolControl {
    event NewSignUp(uint256 PoolId, address UserAddress);
    event NewSignUpNFT(
        uint256 PoolId,
        address UserAddress,
        address TokenAddress,
        uint256 TokenId
    );

    modifier shouldBeActive(uint256 _poolId) {
        require(isPoolActive[_poolId], "Pool is not Active or Created");
        _;
    }

    modifier validateSender() {
        require(
            msg.sender == tx.origin && !isContract(msg.sender),
            "Some thing wrong with the msgSender"
        );
        _;
    }

    function SignUp(uint256 _poolId)
        external
        payable
        whenNotPaused
        shouldBeActive(_poolId)
        validateSender
    {
        Pool storage signUpPool = poolsMap[_poolId];
        if (Admin.FeeToken == address(0) && signUpPool.FeeToken == address(0)) {
            SignUpETH(address(0), Admin.Fee + poolsMap[_poolId].Fee);
        } else {
            // check all combinations of fees
            SignUpETH(Admin.FeeToken, Admin.Fee);
            SignUpERC20(Admin.FeeToken, Admin.Fee);
            SignUpETH(signUpPool.FeeToken, signUpPool.Fee);
            SignUpERC20(signUpPool.FeeToken, signUpPool.Fee);
        }
        Admin.Reserve = SafeMath.add(Admin.Reserve, Admin.Fee);
        signUpPool.Reserve = SafeMath.add(signUpPool.Reserve, signUpPool.Fee);
        emit NewSignUp(_poolId, msg.sender);
    }

    function SignUpETH(address _token, uint256 _fee) internal {
        if (_token == address(0) && _fee > 0)
            require(msg.value >= _fee, "Not Enough Fee Provided");
    }

    function SignUpERC20(address _token, uint256 _fee) internal {
        if (_token != address(0) && _fee > 0)
            TransferInToken(_token, msg.sender, _fee);
    }

    function SignUpWithNFT(
        uint256 _poolId,
        address _tokenAddress,
        uint256 _tokenId
    ) external whenNotPaused shouldBeActive(_poolId) validateSender {
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
}
