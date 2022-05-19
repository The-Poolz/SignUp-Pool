const SignUp = artifacts.require("SignUpPool")
const WhiteList = artifacts.require("WhiteList")

module.exports = async function (deployer) {
  await deployer.deploy(WhiteList)
  await deployer.deploy(SignUp, WhiteList.address)
}
