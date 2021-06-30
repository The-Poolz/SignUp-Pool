// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./Manageable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PoolControl is Manageable {
    event NewPoolCreated(uint256 PoolID);
    
    struct Pool{
        bool isActive;
    }

    mapping(uint256 => Pool) Pools;
    mapping(address => uint256[]) PoolMap;

    uint256 public PoolsCount;

    modifier validatePoolId(uint256 _poolId) {
        require(_poolId < PoolsCount, "Invalid Pool ID");
        _;
    }

    function CreateNewPool() external onlyOwner {
        Pools[PoolsCount] = Pool(false);
        PoolMap[msg.sender].push(PoolsCount);
        emit NewPoolCreated(PoolsCount);
        PoolsCount = SafeMath.add(PoolsCount, 1);
    }

    function ActivatePool(uint256 _poolId) external onlyOwner validatePoolId(_poolId) {
        Pools[_poolId].isActive = true;
    }

    function DeactivatePool(uint256 _poolId) external onlyOwner validatePoolId(_poolId) {
        Pools[_poolId].isActive = false;
    }

    function isPoolActive(uint256 _poolId) public view validatePoolId(_poolId) returns(bool) {
        return Pools[_poolId].isActive;
    }
}