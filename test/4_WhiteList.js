const SignUp = artifacts.require("SignUpPool")
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')
const TestToken = artifacts.require("ERC20Token")
const TestNFT = artifacts.require("ERC721Token")
const BigNumber = require("bignumber.js")
const constants = require('@openzeppelin/test-helpers/src/constants.js')
const WhiteList = artifacts.require("WhiteList")

// potentially needs to be moved to Integrate repo
contract("WhiteList", accounts => {
    let instance, Token, NFT, poolId, ownerAddress = accounts[0], user = accounts[1]
    let whiteListId
    let whiteList
    const fee = '1000'
    const halfPrice = (fee / 2).toString()
    const poolOwner = accounts[6]
    const accountsArray = [user, accounts[2]]

    before(async () => {
        whiteList = await WhiteList.new()
        instance = await SignUp.new(whiteList.address)
        Token = await TestToken.new('TestToken', 'TEST')
        NFT = await TestNFT.new()
        await instance.SetFee(fee, { from: ownerAddress })
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

    it('should pay half price', async () => {
        const notWhiteListed = accounts[7]
        const amountArray = [halfPrice, halfPrice]
        await whiteList.AddAddress(whiteListId, accountsArray, amountArray, { from: poolOwner })
        await instance.SignUp(poolId, { from: user, value: halfPrice })
        await truffleAssert.reverts(instance.SignUp(poolId, { from: notWhiteListed, value: halfPrice }), "Not Enough Fee Provided")
        await whiteList.RemoveAddress(whiteListId, accountsArray, { from: poolOwner })
        await truffleAssert.reverts(instance.SignUp(poolId, { from: user }), "Not Enough Fee Provided")
    })

    it('should withdraw half fee price', async () => {
        const oldBal = new BigNumber((await web3.eth.getBalance(poolOwner)))
        const txnReceipt = await instance.WithdrawPoolFee(poolId, { from: poolOwner })
        const rcpt = await web3.eth.getTransaction(txnReceipt.tx)
        const gasPrice = rcpt.gasPrice
        const actualBalance = new BigNumber((await web3.eth.getBalance(poolOwner)))
        const gas = new BigNumber(txnReceipt.receipt.gasUsed * gasPrice)
        const expectedBalance = BigNumber.sum(oldBal, halfPrice).minus(gas)
        assert.equal(actualBalance.toString(), expectedBalance.toString(), 'check pool owner balance')
    })

    it('whitelist allocation more than fee price', async () => {
        const allocation = fee * 10
        const amountArray = [allocation, allocation]
        await whiteList.AddAddress(whiteListId, accountsArray, amountArray, { from: poolOwner })
        const tx = await instance.SignUp(poolId, { from: user })
        const pid = tx.logs[0].args.PoolId
        const address = tx.logs[0].args.UserAddress
        assert.equal(pid, poolId)
        assert.equal(address, user)
    })

    it('should revert pool fee', async () => {
        const notWhiteListed = accounts[7]
        await truffleAssert.reverts(instance.SignUp(poolId, { from: notWhiteListed }), "Not Enough Fee Provided")
        await whiteList.RemoveAddress(whiteListId, accountsArray, { from: poolOwner })
        await truffleAssert.reverts(instance.SignUp(poolId, { from: user }), "Not Enough Fee Provided")
        await truffleAssert.reverts(instance.WithdrawPoolFee(poolId, { from: poolOwner }), "Fee amount is zero")
    })
})