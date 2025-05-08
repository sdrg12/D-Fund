// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DonateEther {
    address public platformAccount;

    // 생성자에서 플랫폼 계정 설정
    constructor(address _platformAccount) {
        platformAccount = _platformAccount;
    }

    // 후원 기능
    function donateEther() external payable {
        // 송금된 금액을 platformAccount로 전송
        require(msg.value > 0, "Send more than 0 ETH.");
        payable(platformAccount).transfer(msg.value);
    }
}