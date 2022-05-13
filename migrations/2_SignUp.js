const SignUp = artifacts.require("SignUpPool")
const constants = require('@openzeppelin/test-helpers/src/constants.js')

module.exports = function (deployer) {
  deployer.deploy(SignUp, constants.ZERO_ADDRESS)
}
