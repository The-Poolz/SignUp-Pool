const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const TestToken = artifacts.require("ERC20Token");
const TestNFT = artifacts.require("ERC721Token");
const constants = require('@openzeppelin/test-helpers/src/constants.js');

contract('Admin Settings', accounts => {
    let instance, Token, NFT, ownerAddress = accounts[0]

    before(async () => {
        instance = await SignUp.new(constants.ZERO_ADDRESS)
        NFT = await TestNFT.new()
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should set ETH Fee', async () => {
        const fee = web3.utils.toWei('0.01', 'ether')
        await instance.SetFee(constants.ZERO_ADDRESS, fee, { from: ownerAddress })
        const actualFee = await instance.Fee()
        const feeToken = await instance.FeeToken()
        assert.equal(actualFee, fee)
        assert.equal(feeToken, constants.ZERO_ADDRESS)
    })

    it('should set/get FeeTokenAddress', async () => {
        const fee = '10000'
        await instance.SetFee(Token.address, fee, { from: ownerAddress })
        const actualFee = await instance.Fee()
        const feeToken = await instance.FeeToken()
        assert.equal(feeToken, Token.address)
        assert.equal(actualFee, fee)
    })

    it('should pause', async () => {
        await instance.Pause({ from: ownerAddress })
        const result = await instance.paused()
        assert.equal(result, true)
    })

    it('should unpause', async () => {
        await instance.Unpause({ from: ownerAddress })
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