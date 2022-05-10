// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./Manageable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PoolControl is Manageable {
    event NewPoolCreated(
        uint256 PoolId,
        address Owner,
        address TokenFee,
        uint256 Fee
    );
    event PoolActivated(uint256 PoolId);
    event PoolDeactivated(uint256 PoolId);

    mapping(uint256 => Pool) public poolsMap;
    uint256 public PoolsCount;

    struct Pool {
        address payable Owner; // The pool owner
        address FeeToken; // Which token will be used
        uint256 Fee; // The pool fee
        uint256 Reserve; // Reserve of fee
        bool status; // is pool active
    }

    modifier validatePoolId(uint256 _poolId) {
        require(_poolId < PoolsCount, "Invalid Pool ID");
        _;
    }

    modifier onlyPoolOwner(uint256 _poolId) {
        require(poolsMap[_poolId].Owner == msg.sender, "Invalid Pool owner");
        _;
    }

    modifier validateStatus(uint256 _poolId, bool _status) {
        require(poolsMap[_poolId].status == _status, "Invalid pool status");
        _;
    }

    function CreateNewPool(address _token, uint256 _price) external {
        Pool storage newPool = poolsMap[PoolsCount];
        newPool.status = true;
        newPool.Owner = msg.sender;
        newPool.FeeToken = _token;
        newPool.Fee = _price;
        emit NewPoolCreated(PoolsCount, msg.sender, _token, _price);
        PoolsCount = SafeMath.add(PoolsCount, 1);
    }

    function ActivatePool(uint256 _poolId)
        external
        validatePoolId(_poolId)
        onlyPoolOwner(_poolId)
        validateStatus(_poolId, false)
    {
        poolsMap[_poolId].status = true;
        emit PoolActivated(_poolId);
    }

    function DeactivatePool(uint256 _poolId)
        external
        validatePoolId(_poolId)
        onlyPoolOwner(_poolId)
        validateStatus(_poolId, true)
    {
        poolsMap[_poolId].status = false;
        emit PoolDeactivated(_poolId);
    }

    function WithdrawPoolFee(uint256 _poolId) external onlyPoolOwner(_poolId) {
        WithdrawFee(
            poolsMap[_poolId].FeeToken,
            poolsMap[_poolId].Owner,
            poolsMap[_poolId].Reserve
        );
        poolsMap[_poolId].Reserve = 0;
    }
}
