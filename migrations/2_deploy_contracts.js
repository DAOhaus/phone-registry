var Oracle = artifacts.require("./contracts/Oracle.sol");
var Registry = artifacts.require("./contracts/Registry.sol");

module.exports = function(deployer) {
  deployer.deploy(Oracle);
  deployer.deploy(Registry);
};
