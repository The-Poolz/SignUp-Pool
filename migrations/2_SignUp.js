const SignUp = artifacts.require("SignUpPool");

module.exports = function (deployer) {
  deployer.deploy(SignUp);
};
