const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const TestToken = artifacts.require("ERC20Token");
const TestNFT = artifacts.require("ERC721Token")
const BigNumber = require("bignumber.js")
const constants = require('@openzeppelin/test-helpers/src/constants.js')

contract("WhiteList", accounts => {
    let instance, Token, NFT, poolId, ownerAddress = accounts[0], user = accounts[1]
    let whiteListId
    const fee = '1000'
    const poolOwner = accounts[6]

    before(async () => {
        instance = await SignUp.new(constants.ZERO_ADDRESS)
        Token = await TestToken.new('TestToken', 'TEST')
        NFT = await TestNFT.new()
        await instance.SetFee(constants.ZERO_ADDRESS, fee, { from: ownerAddress })
        await instance.SetWhiteListFee(fee)
    })

    it('should activate whitelist', async () => {
        const tx = await instance.CreateNewPool(constants.ZERO_ADDRESS, fee, { from: poolOwner, value: fee })
        poolId = tx.logs[0].args.PoolId.toString()
        const result = await instance.ActivateWhiteList(poolId, { from: poolOwner, value: fee })
        const expectedId = '1'
        whiteListId = result.logs[0].args.WhiteListId.toString()
        assert.equal(result.logs[0].args.PoolId.toString(), poolId, 'invalid poolId')
        assert.equal(whiteListId, expectedId, 'Invalid WhiteList Id')
    })

    it('should withdraw whitelist fee', async () => {
        const receiverAddr = accounts[2]
        const oldBal = new BigNumber((await web3.eth.getBalance(receiverAddr)))
        await instance.WithdrawFee(receiverAddr, { from: ownerAddress })
        const actualBalance = new BigNumber((await web3.eth.getBalance(receiverAddr)))
        assert.equal(actualBalance.toString(), BigNumber.sum(oldBal, fee * 2).toString(), 'wrong withraw amount')
    })

    it('should free to pay', async () => {
        const accountsArray = [user, accounts[2]]
        const notWhiteListed = accounts[7]
        await instance.AddAddress(poolId, accountsArray, { from: poolOwner })
        await instance.SignUp(poolId, { from: user })
        await truffleAssert.reverts(instance.SignUp(poolId, { from: notWhiteListed }), "Not Enough Fee Provided")
        await instance.RemoveAddress(poolId, accountsArray, { from: poolOwner })
        await truffleAssert.reverts(instance.SignUp(poolId, { from: notWhiteListed }), "Not Enough Fee Provided")
        await truffleAssert.reverts(instance.WithdrawPoolFee(poolId, { from: poolOwner }), "Fee amount is zero")
    })
})