// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./Manageable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PoolControl is Manageable {
    event NewPoolActivated(uint256 PoolId);
    event PoolActivated(uint256 PoolId);
    event PoolDeactivated(uint256 PoolId);
    
    mapping(uint256 => bool) public isPoolActive;
    uint256 public PoolsCount;

    modifier validatePoolId(uint256 _poolId) {
        require(_poolId < PoolsCount, "Invalid Pool ID");
        _;
    }

    function CreateNewPool() external onlyOwner {
        isPoolActive[PoolsCount] = true;
        emit NewPoolActivated(PoolsCount);
        PoolsCount = SafeMath.add(PoolsCount, 1);
    }

    function ActivatePool(uint256 _poolId) external onlyOwner validatePoolId(_poolId) {
        require(!isPoolActive[_poolId], "Pool is Already Active");
        isPoolActive[_poolId] = true;
        emit PoolActivated(_poolId);
    }

    function DeactivatePool(uint256 _poolId) external onlyOwner validatePoolId(_poolId) {
        require(isPoolActive[_poolId], "Pool is Already Inactive");
        isPoolActive[_poolId] = false;
        emit PoolDeactivated(_poolId);
    }
}