const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const TestToken = artifacts.require("Token");

contract("Sign Up flow", accounts => {
    let instance, Token, poolId, ownerAddress = accounts[0], user1 = accounts[1]

    before( async () => {
        instance = await SignUp.new()
        Token = await TestToken.new('TestToken', 'TEST');
        const tx = await instance.CreateNewPool({from: ownerAddress})
        poolId = tx.logs[0].args[0].toNumber()
    })

    it('Signing Up when Fee is Zero', async () => {
        const tx = await instance.SignUp(poolId, {from: user1 })
        const pid = tx.logs[0].args.PoolId
        const address = tx.logs[0].args.UserAddress
        assert.equal(pid, poolId)
        assert.equal(address, user1)
    })

    describe('Signing Up with ETH', () => {
        const fee = web3.utils.toWei('0.001', 'ether')

        before( async () => {
            await instance.setEthFee(fee, {from: ownerAddress})
        })

        it('should sign up paying Fee in ETH', async () => {
            const tx = await instance.SignUp(poolId, {from: accounts[2], value: fee})
            const pid = tx.logs[0].args.PoolId
            const address = tx.logs[0].args.UserAddress
            assert.equal(pid, poolId)
            assert.equal(address, accounts[2])
        })

        
        it('withdrawing ETH Fee', async () => {
            const oldBal = await web3.eth.getBalance(accounts[9])
            const feeBal = await web3.eth.getBalance(instance.address)
            await instance.WithdrawETHFee(accounts[9], {from: ownerAddress})
            const newBal = await web3.eth.getBalance(accounts[9])
            assert.equal(parseInt(newBal), parseInt(oldBal) + parseInt(feeBal))
        })

        it('Fail to invest when fee not provided', async () => {
            const tx = instance.SignUp(poolId, {from: accounts[3]})
            await truffleAssert.reverts(tx, 'Not Enough Fee Provided')
        })

        it('Fail to Sign Up when Pool does not exist', async () => {
            const tx = instance.SignUp(10, {from: accounts[5]})
            truffleAssert.reverts(tx, 'Pool is not Active or Created')
        })
    })

    describe('Signing Up with ERC20', () => {
        const fee = '10000'

        before( async () => {
            await instance.setERC20Fee(Token.address, fee, {from: ownerAddress})
            await Token.transfer(accounts[3], fee, {from: ownerAddress})
        })

        it('should sign up paying Fee in ERC20', async () => {
            await Token.approve(instance.address, fee, {from: accounts[3]})
            const tx = await instance.SignUp(poolId, {from: accounts[3]})
            const pid = tx.logs[1].args.PoolId
            const address = tx.logs[1].args.UserAddress
            assert.equal(pid, poolId)
            assert.equal(address, accounts[3])
        })

        it('should fail to invest when Fee not provided', async () => {
            const tx = instance.SignUp(poolId, {from: accounts[4]})
            await truffleAssert.reverts(tx, 'no allowance') // revert msg from poolz-helper
        })

        it('withdrawing ERC20 Fee', async () => {
            const oldBal = await Token.balanceOf(accounts[9])
            const feeBal = await Token.balanceOf(instance.address)
            await instance.WithdrawERC20Fee(accounts[9], {from: ownerAddress})
            const newBal = await Token.balanceOf(accounts[9])
            assert.equal((newBal).toNumber(), (oldBal).toNumber() + (feeBal).toNumber())
        })

        it('should SignUp when Fee is 0', async () => {
            await instance.setERC20Fee(Token.address, 0, {from: ownerAddress})
            const tx = await instance.SignUp(poolId, {from: accounts[6]})
            // console.log(tx.logs)
            const pid = tx.logs[0].args.PoolId
            const address = tx.logs[0].args.UserAddress
            assert.equal(pid, poolId)
            assert.equal(address, accounts[6])
        })
    })
})