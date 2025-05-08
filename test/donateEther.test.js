const DonateEther = artifacts.require("DonateEther");

contract("DonateEther", (accounts) => {
  it("should accept donations and store balance", async () => {
    const contract = await DonateEther.deployed();

    const donor = accounts[1];
    const amount = web3.utils.toWei("1", "ether");

    // 이전 수신자 잔액
    const oldBalance = await web3.eth.getBalance(accounts[0]);

    // 기부
    await contract.donateEther({ from: donor, value: amount });

    // 이후 수신자 잔액
    const newBalance = await web3.eth.getBalance(accounts[0]);

    assert.equal(
      BigInt(newBalance) - BigInt(oldBalance),
      BigInt(amount),
      "Donation amount was not transferred correctly"
    );
  });
});