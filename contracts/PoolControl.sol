// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./Manageable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PoolControl is Manageable {
    event NewPoolActivated(uint256 PoolId);
    event PoolActivated(uint256 PoolId);
    event PoolDeactivated(uint256 PoolId);
    
    mapping(uint256 => bool) public isPoolActive;
    mapping(uint256 => address) public poolOwner;
    uint256 public PoolsCount;

    modifier validatePoolId(uint256 _poolId) {
        require(_poolId < PoolsCount, "Invalid Pool ID");
        _;
    }

    function CreateNewPool() external {
        isPoolActive[PoolsCount] = true;
        emit NewPoolActivated(PoolsCount);
        PoolsCount = SafeMath.add(PoolsCount, 1);
        poolOwner[PoolsCount] = msg.sender;
    }

    function ActivatePool(uint256 _poolId) external validatePoolId(_poolId) {
        require(!isPoolActive[_poolId], "Pool is Already Active");
        require(poolOwner[PoolsCount] == msg.sender, "Invalid Pool owner");
        isPoolActive[_poolId] = true;
        emit PoolActivated(_poolId);
    }

    function DeactivatePool(uint256 _poolId) external validatePoolId(_poolId) {
        require(isPoolActive[_poolId], "Pool is Already Inactive");
        require(poolOwner[PoolsCount] == msg.sender, "Invalid Pool owner");
        isPoolActive[_poolId] = false;
        emit PoolDeactivated(_poolId);
    }
}