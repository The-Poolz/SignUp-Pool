const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const TestToken = artifacts.require("Token");
const TestNFT = artifacts.require("MyNFT");
const constants = require('@openzeppelin/test-helpers/src/constants.js');

contract('Admin Settings', accounts => {
    let instance, Token, NFT, ownerAddress = accounts[0]

    before(async () => {
        instance = await SignUp.new()
        NFT = await TestNFT.new()
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should set ETH Fee', async () => {
        const fee = web3.utils.toWei('0.01', 'ether')
        await instance.setFee(constants.ZERO_ADDRESS, fee, { from: ownerAddress })
        const admin = await instance.Admin()
        assert.equal(admin['Fee'], fee)
        assert.equal(admin['FeeToken'], constants.ZERO_ADDRESS)
    })

    it('should set/get FeeTokenAddress', async () => {
        const fee = '10000'
        await instance.setFee(Token.address, fee, { from: ownerAddress })
        const admin = await instance.Admin()
        assert.equal(admin['FeeToken'], Token.address)
        assert.equal(admin['Fee'], fee)
    })

    it('should pause', async () => {
        await instance.pause({ from: ownerAddress })
        const result = await instance.paused()
        assert.equal(result, true)
    })

    it('should unpause', async () => {
        await instance.unpause({ from: ownerAddress })
        const result = await instance.paused()
        assert.equal(result, false)
    })

    it('should approve address for all NFTs', async () => {
        await instance.ApproveAllNFT(NFT.address, ownerAddress, true)
        const result = await NFT.isApprovedForAll(instance.address, ownerAddress)
        assert.equal(result, true)
    })

    it('should revoke approval address for all NFTs', async () => {
        await instance.ApproveAllNFT(NFT.address, ownerAddress, false)
        const result = await NFT.isApprovedForAll(instance.address, ownerAddress)
        assert.equal(result, false)
    })
})