const SignUp = artifacts.require("SignUpPool");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const TestToken = artifacts.require("Token");
// const zero_address = "0x0000000000000000000000000000000000000000";

contract('Pool Control', accounts => {
    let instance, Token, ownerAddress = accounts[0], poolId

    before( async () => {
        instance = await SignUp.deployed()
        Token = await TestToken.new('TestToken', 'TEST');
    })

    it('should activate a new pool', async () => {
        const tx = await instance.CreateNewPool({from: ownerAddress})
        poolId = tx.logs[0].args[0].toNumber()
        const result = await instance.isPoolActive(poolId)
        assert.equal(tx.logs[0].event, 'NewPoolActivated')
        assert.equal(result, true)
    })

    it('should deactive existing pool', async () => {
        const tx = await instance.DeactivatePool(poolId, {from: ownerAddress})
        const result = await instance.isPoolActive(poolId)
        assert.equal(tx.logs[0].event, 'PoolDeactivated')
        assert.equal(result, false)
    })

    it('should fail to deactivate when already inactive', async () => {
        const tx = instance.DeactivatePool(poolId, {from: ownerAddress})
        await truffleAssert.reverts(tx, "Pool is Already Inactive")
    })

    it('should activate existing pool', async () => {
        const tx = await instance.ActivatePool(poolId, {from: ownerAddress})
        const result = await instance.isPoolActive(poolId)
        assert.equal(tx.logs[0].event, 'PoolActivated')
        assert.equal(result, true)
    })

    it('should fail to activate when already active', async () => {
        const tx = instance.ActivatePool(poolId, {from: ownerAddress})
        await truffleAssert.reverts(tx, "Pool is Already Active")
    })

})