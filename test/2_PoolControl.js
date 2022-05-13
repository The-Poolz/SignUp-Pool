const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const TestToken = artifacts.require("ERC20Token");
const constants = require('@openzeppelin/test-helpers/src/constants.js');
const BigNumber = require('bignumber.js');

contract('Pool Control', accounts => {
    let instance, Token, poolId
    const ownerAddress = accounts[0], investor = accounts[2]
    const price = '100'

    before(async () => {
        instance = await SignUp.new(constants.ZERO_ADDRESS)
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should activate a new pool', async () => {
        const tx = await instance.CreateNewPool(constants.ZERO_ADDRESS, price, { from: ownerAddress })
        poolId = tx.logs[0].args.PoolId
        const result = await instance.poolsMap(poolId)
        assert.equal(tx.logs[0].event, 'NewPoolCreated')
        assert.equal(result['Status'], true)
    })

    it('should deactive existing pool', async () => {
        const tx = await instance.DeactivatePool(poolId, { from: ownerAddress })
        const result = await instance.poolsMap(poolId)
        assert.equal(tx.logs[0].event, 'PoolDeactivated')
        assert.equal(result['Status'], false)
    })

    it('should fail to deactivate when already inactive', async () => {
        const tx = instance.DeactivatePool(poolId, { from: ownerAddress })
        await truffleAssert.reverts(tx, "Invalid pool status")
    })

    it('should activate existing pool', async () => {
        const tx = await instance.ActivatePool(poolId, { from: ownerAddress })
        const result = await instance.poolsMap(poolId)
        assert.equal(tx.logs[0].event, 'PoolActivated')
        assert.equal(result['Status'], true)
    })

    it('should fail to activate when already active', async () => {
        const tx = instance.ActivatePool(poolId, { from: ownerAddress })
        await truffleAssert.reverts(tx, "Invalid pool status")
    })

    it('should fail to activate pool which does not exist', async () => {
        const tx = instance.ActivatePool(10, { from: ownerAddress })
        await truffleAssert.reverts(tx, "Invalid Pool ID")
    })

    it('should fail to deactivate when invalid pool owner ', async () => {
        await truffleAssert.reverts(instance.DeactivatePool(poolId, { from: investor }), "Invalid Pool owner")
    })

    it('should fail to activate when invalid pool owner', async () => {
        await instance.DeactivatePool(poolId, { from: ownerAddress })
        await truffleAssert.reverts(instance.ActivatePool(poolId, { from: investor }), "Invalid Pool owner")
    })

    describe('Withdraw Pool Owner Fee', () => {
        const poolOwner = accounts[3]
        it('should withdraw pool fee to pool owner when main coin', async () => {
            const fee = new BigNumber(web3.utils.toWei('0.05', 'ether').toString())
            const tx = await instance.CreateNewPool(constants.ZERO_ADDRESS, fee, { from: poolOwner })
            poolId = tx.logs[0].args.PoolId
            await instance.SignUp(poolId, { from: investor, value: fee }) //
            const oldBal = new BigNumber((await web3.eth.getBalance(poolOwner)))
            const txnReceipt = await instance.WithdrawPoolFee(poolId, { from: poolOwner })
            const rcpt = await web3.eth.getTransaction(txnReceipt.tx)
            const gasPrice = rcpt.gasPrice
            const actualBalance = new BigNumber((await web3.eth.getBalance(poolOwner)))
            const gas = new BigNumber(txnReceipt.receipt.gasUsed * gasPrice)
            const expectedBalance = BigNumber.sum(oldBal, fee).minus(gas)
            assert.equal(actualBalance.toString(), expectedBalance.toString())
        })

        it('should withdraw pool fee to pool owner when ERC20', async () => {
            const fee = '100000'
            const tx = await instance.CreateNewPool(Token.address, fee, { from: poolOwner })
            poolId = tx.logs[0].args.PoolId
            const oldBal = await Token.balanceOf(poolOwner)
            await Token.transfer(investor, fee)
            await Token.approve(instance.address, fee, { from: investor })
            await instance.SignUp(poolId, { from: investor })
            await instance.WithdrawPoolFee(poolId, { from: poolOwner })
            const actualBalance = await Token.balanceOf(poolOwner)
            assert.equal(oldBal, '0', 'invalid balance')
            assert.equal(actualBalance, fee, 'invalid balance')
        })
    })
})