const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const TestToken = artifacts.require("Token");

contract('Admin Settings', accounts => {
    let instance, Token, ownerAddress = accounts[0]

    before( async () => {
        instance = await SignUp.deployed()
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should set/get Fee', async () => {
        const fee = web3.utils.toWei('0.01', 'ether')
        await instance.SetFee(fee, {from: ownerAddress})
        const result = await instance.Fee()
        assert.equal(result, fee)
    })

    it('should set/get FeeTokenAddress', async () => {
        const tokenAddress = Token.address
        await instance.SetFeeTokenAddress(tokenAddress, {from: ownerAddress})
        const result = await instance.FeeTokenAddress()
        assert.equal(result, tokenAddress)
    })

    it('should pause', async () => {
        await instance.pause({from: ownerAddress})
        const result = await instance.paused()
        assert.equal(result, true)
    })

    it('should unpause', async () => {
        await instance.unpause({from: ownerAddress})
        const result = await instance.paused()
        assert.equal(result, false)
    })
})