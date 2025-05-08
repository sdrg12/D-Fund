const DonateEther = artifacts.require("donateEther");

module.exports = async function (deployer, network, accounts) {
  const platformAccount = accounts[0];
  await deployer.deploy(DonateEther, platformAccount);
};