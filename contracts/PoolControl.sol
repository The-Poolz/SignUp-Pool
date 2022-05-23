// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Manageable.sol";
import "poolz-helper-v2/contracts/interfaces/IWhiteList.sol";

contract PoolControl is Manageable {
    event NewPoolCreated(
        uint256 PoolId,
        address Owner,
        address TokenFee,
        uint256 Fee
    );
    event PoolActivated(uint256 PoolId);
    event PoolDeactivated(uint256 PoolId);
    event WhiteListActivated(uint256 PoolId, uint256 WhiteListId);

    IWhiteList public WhiteListAddress;
    mapping(uint256 => Pool) public poolsMap;
    uint256 public PoolsCount;

    struct Pool {
        address payable Owner; // The pool owner
        address FeeToken; // Which token will be used
        uint256 Fee; // The pool fee
        uint256 Reserve; // Reserve of fee
        bool Status; // is pool active
        uint256 WhiteListId;
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
        require(poolsMap[_poolId].Status == _status, "Invalid pool status");
        _;
    }

    modifier whiteListStatus(uint256 _poolId, bool _status) {
        require(
            _status
                ? poolsMap[_poolId].WhiteListId != 0
                : poolsMap[_poolId].WhiteListId == 0,
            "Invalid WhiteList status"
        );
        _;
    }

    function CreateNewPool(address _token, uint256 _price) external payable {
        PayFee();
        Pool storage newPool = poolsMap[PoolsCount];
        newPool.Status = true;
        newPool.Owner = payable(msg.sender);
        newPool.FeeToken = _token;
        newPool.Fee = _price;
        emit NewPoolCreated(
            PoolsCount,
            newPool.Owner,
            newPool.FeeToken,
            newPool.Fee
        );
        ++PoolsCount;
    }

    function ActivatePool(uint256 _poolId)
        external
        validatePoolId(_poolId)
        onlyPoolOwner(_poolId)
        validateStatus(_poolId, false)
    {
        poolsMap[_poolId].Status = true;
        emit PoolActivated(_poolId);
    }

    function DeactivatePool(uint256 _poolId)
        external
        validatePoolId(_poolId)
        onlyPoolOwner(_poolId)
        validateStatus(_poolId, true)
    {
        poolsMap[_poolId].Status = false;
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

    function ActivateWhiteList(uint256 _poolId)
        public
        payable
        onlyPoolOwner(_poolId)
        whiteListStatus(_poolId, false)
    {
        poolsMap[_poolId].WhiteListId = CreateManualWhiteList();
        emit WhiteListActivated(_poolId, poolsMap[_poolId].WhiteListId);
    }

    function CreateManualWhiteList() internal returns (uint256) {
        uint256 whitelistId = WhiteListAddress.CreateManualWhiteList(
            type(uint256).max,
            address(this)
        );
        WhiteListAddress.ChangeCreator(whitelistId, _msgSender());
        return whitelistId;
    }
}
