const SignUp = artifacts.require("SignUpPool")
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')
const TestToken = artifacts.require("ERC20Token")
const TestNFT = artifacts.require("ERC721Token")
const BigNumber = require("bignumber.js")
const constants = require('@openzeppelin/test-helpers/src/constants.js')

contract("Sign Up flow", accounts => {
    let instance, Token, NFT, poolId, poolId2, ownerAddress = accounts[0], user1 = accounts[1]
    const price = '0', whiteList = accounts[7]
    let feePrice = "5"

    before(async () => {
        instance = await SignUp.new(whiteList)
        Token = await TestToken.new('TestToken', 'TEST')
        NFT = await TestNFT.new()
        const tx = await instance.CreateNewPool(constants.ZERO_ADDRESS, price, { from: accounts[6] })
        const tx2 = await instance.CreateNewPool(constants.ZERO_ADDRESS, feePrice, { from: accounts[6] })
        poolId = tx.logs[0].args[0].toNumber()
        poolId2 = tx2.logs[0].args[0].toNumber()
    })

    it('Signing Up when Fee is Zero', async () => {
        const tx = await instance.SignUp(poolId, { from: user1 })
        const pid = tx.logs[0].args.PoolId
        const address = tx.logs[0].args.UserAddress
        assert.equal(pid, poolId)
        assert.equal(address, user1)
    })

    describe('Signing Up with ETH', () => {
        const fee = web3.utils.toWei('0.001', 'ether')

        before(async () => {
            await instance.SetFee(constants.ZERO_ADDRESS, fee, { from: ownerAddress })
        })

        it('should sign up paying Fee in ETH', async () => {
            const tx = await instance.SignUp(poolId, { from: accounts[2], value: fee })
            const pid = tx.logs[0].args.PoolId
            const address = tx.logs[0].args.UserAddress
            assert.equal(pid, poolId)
            assert.equal(address, accounts[2])
        })

        it('withdrawing ETH Fee', async () => {
            const tx = await instance.CreateNewPool(constants.ZERO_ADDRESS, fee, { from: accounts[9], value: fee })
            poolId = tx.logs[0].args.PoolId
            const oldBal = new BigNumber((await web3.eth.getBalance(accounts[9])))
            await instance.WithdrawFee(accounts[9], { from: ownerAddress })
            const actualBalance = new BigNumber((await web3.eth.getBalance(accounts[9])))
            const expectedBalance = BigNumber.sum(oldBal, fee)
            assert.equal(actualBalance.toString(), expectedBalance.toString())
        })

        it('Fail to invest when fee not provided', async () => {
            const tx = instance.SignUp(poolId2, { from: accounts[3] })
            await truffleAssert.reverts(tx, 'Not Enough Fee Provided')
        })

        it('Fail to Sign Up when Pool does not exist', async () => {
            const tx = instance.SignUp(10, { from: accounts[5], value: '10' })
            truffleAssert.reverts(tx, 'Invalid pool status')
        })
    })

    describe('Signing Up with ERC20', () => {
        const fee = '1000'
        let poolId3

        before(async () => {
            await instance.SetFee(Token.address, fee, { from: ownerAddress })
            await Token.transfer(accounts[3], fee, { from: ownerAddress })
            await Token.approve(instance.address, fee, { from: accounts[3] })
            const tx = await instance.CreateNewPool(Token.address, fee, { from: accounts[3] })
            poolId3 = tx.logs[1].args.PoolId
        })

        it('should sign up paying Fee in ERC20', async () => {
            await Token.transfer(accounts[4], fee, { from: ownerAddress })
            await Token.approve(instance.address, fee, { from: accounts[4] })
            const tx = await instance.SignUp(poolId3, { from: accounts[4] })
            const pid = tx.logs[1].args.PoolId
            const address = tx.logs[1].args.UserAddress
            assert.equal(pid.toNumber(), poolId3.toNumber())
            assert.equal(address, accounts[4])
        })

        it('should fail to invest when Fee not provided', async () => {
            const tx = instance.SignUp(poolId2, { from: accounts[4] })
            await truffleAssert.reverts(tx, 'Not Enough Fee Provided') // revert msg from poolz-helper
        })

        it('withdrawing ERC20 Fee', async () => {
            const oldBal = await Token.balanceOf(accounts[9])
            const feeBal = await instance.Reserve()
            await instance.WithdrawFee(accounts[9], { from: ownerAddress })
            const newBal = await Token.balanceOf(accounts[9])
            assert.equal((newBal).toNumber(), (oldBal).toNumber() + (feeBal).toNumber())
        })

        it('should SignUp when Fee is 0', async () => {
            await Token.transfer(accounts[6], fee, { from: ownerAddress })
            await Token.approve(instance.address, fee, { from: accounts[6] })
            const tx = await instance.CreateNewPool(Token.address, 0, { from: accounts[6] })
            const poolId = tx.logs[1].args.PoolId
            const tx2 = await instance.SignUp(poolId, { from: accounts[6] })
            const pid = tx2.logs[0].args.PoolId
            const address = tx2.logs[0].args.UserAddress
            assert.equal(pid.toString(), poolId.toString())
            assert.equal(address, accounts[6])
        })

        it('should withdraw if reserve greatter than zero', async () => {
            const fee = 1000
            await instance.SetFee(Token.address, fee, { from: ownerAddress })
            await Token.approve(instance.address, fee, { from: accounts[5] })
            await Token.transfer(accounts[5], fee, { from: ownerAddress })
            const tx = await instance.CreateNewPool(Token.address, fee, { from: accounts[5] })
            poolId = tx.logs[1].args.PoolId
            const oldBal = await Token.balanceOf(ownerAddress)
            await Token.transfer(accounts[4], fee, { from: ownerAddress })
            const nextBal = await Token.balanceOf(ownerAddress)
            await Token.approve(instance.address, fee, { from: accounts[4] })
            await instance.SignUp(poolId, { from: accounts[4] })
            await instance.SetFee(Token.address, fee, { from: ownerAddress })
            const actualBalance = await Token.balanceOf(ownerAddress)
            assert.equal(oldBal.toNumber(), (nextBal.toNumber() + fee))
            assert.equal(oldBal.toNumber(), (await Token.totalSupply() - fee * 3).toString(), 'invalid balance')
            assert.equal(actualBalance.toNumber(), (await Token.totalSupply() - fee * 3).toString(), 'invalid balance')
        })
    })

    describe('Signing Up with ERC721', () => {
        let tokenId

        it('Minting new NFT', async () => {
            const tx = await NFT.awardItem(ownerAddress, { from: ownerAddress })
            tokenId = tx.logs[0].args.tokenId.toString()
            const owner = await NFT.ownerOf(tokenId)
            const bal = await NFT.balanceOf(ownerAddress)
            assert.equal(owner, ownerAddress)
            assert.equal(bal, 1)
        })

        it('Signing Up with NFT by single approval', async () => {
            await NFT.approve(instance.address, tokenId, { from: ownerAddress })
            const tx = await instance.SignUpWithNFT(poolId, NFT.address, tokenId)
            const userAddress = tx.logs[1].args.UserAddress
            const tokenAddress = tx.logs[1].args.TokenAddress
            const tid = tx.logs[1].args.TokenId
            const nftOnwer = await NFT.ownerOf(tokenId)
            assert.equal(userAddress, ownerAddress)
            assert.equal(tokenAddress, NFT.address)
            assert.equal(tid, tokenId)
            assert.equal(nftOnwer, instance.address)
        })

        it('Withdrawing NFT', async () => {
            const tx = await instance.WithdrawNFT(NFT.address, tokenId, ownerAddress, { from: ownerAddress })
            const newOwner = await NFT.ownerOf(tokenId)
            assert.equal(newOwner, ownerAddress)
        })

        it('Signing Up with NFT by All Approval', async () => {
            await NFT.setApprovalForAll(instance.address, true, { from: ownerAddress })
            const tx = await instance.SignUpWithNFT(poolId, NFT.address, tokenId)
            const userAddress = tx.logs[1].args.UserAddress
            const tokenAddress = tx.logs[1].args.TokenAddress
            const tid = tx.logs[1].args.TokenId
            const nftOnwer = await NFT.ownerOf(tokenId)
            assert.equal(userAddress, ownerAddress)
            assert.equal(tokenAddress, NFT.address)
            assert.equal(tid, tokenId)
            assert.equal(nftOnwer, instance.address)
        })
    })
})