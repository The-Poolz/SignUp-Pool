const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const TestToken = artifacts.require("ERC20Token");
const TestNFT = artifacts.require("ERC721Token")
const BigNumber = require("bignumber.js")
const constants = require('@openzeppelin/test-helpers/src/constants.js')
const WhiteList = artifacts.require("WhiteList")

contract("WhiteList", accounts => {
    let instance, Token, NFT, poolId, ownerAddress = accounts[0], user = accounts[1]
    let whiteListId
    let whiteList
    const fee = '1000'
    const poolOwner = accounts[6]

    before(async () => {
        whiteList = await WhiteList.new()
        instance = await SignUp.new(whiteList.address)
        Token = await TestToken.new('TestToken', 'TEST')
        NFT = await TestNFT.new()
        await instance.SetFee(constants.ZERO_ADDRESS, fee, { from: ownerAddress })
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
})