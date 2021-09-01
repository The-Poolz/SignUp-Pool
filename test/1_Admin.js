const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const TestToken = artifacts.require("Token");
const TestNFT = artifacts.require("MyNFT");
const zero_address = "0x0000000000000000000000000000000000000000";

contract('Admin Settings', accounts => {
    let instance, Token, NFT, ownerAddress = accounts[0]

    before( async () => {
        instance = await SignUp.new()
        NFT = await TestNFT.new()
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should set ETH Fee', async () => {
        const fee = web3.utils.toWei('0.01', 'ether')
        await instance.setEthFee(fee, {from: ownerAddress})
        const resultFee = await instance.Fee()
        const resultAddress = await instance.FeeTokenAddress()
        assert.equal(resultFee, fee)
        assert.equal(resultAddress, zero_address)
    })

    it('should set/get FeeTokenAddress', async () => {
        const fee = '10000'
        await instance.setERC20Fee(Token.address, fee, {from: ownerAddress})
        const resultAddress = await instance.FeeTokenAddress()
        const resultFee = await instance.Fee()
        assert.equal(resultAddress, Token.address)
        assert.equal(resultFee, fee)
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