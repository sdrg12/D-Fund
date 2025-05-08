import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

// Ganache를 켤 때마다 account[0]의 주소로 하드코딩 해 줘야 함
const platformAddress = '0x30A45A7506D9C916336D1537C9d00361169dB22A';

const projects = [
  {
    id: 1,
    title: 'Test 1',
    description: 'This is donation test 1.',
    targetAmount: 10,
    deadline: '2025-12-31',
    contractAddress: platformAddress,
  },
  {
    id: 2,
    title: 'Test 2',
    description: 'This is donation test 2.',
    targetAmount: 5,
    deadline: '2025-11-30',
    contractAddress: platformAddress,
  },
];

function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === parseInt(id));
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const storageKey = `fundedAmount-${project?.id}`;
  const [fundedAmount, setFundedAmount] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseFloat(saved) : 0;
  });

  const handleFund = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        project.contractAddress,
        ['function donateEther() external payable'],
        signer
      );

      const txResponse = await contract.donateEther({
        value: ethers.utils.parseEther(amount),
      });

      await txResponse.wait();
      const newTotal = fundedAmount + parseFloat(amount);
      setFundedAmount(newTotal);
      localStorage.setItem(storageKey, newTotal.toString());

      alert(`후원 성공! 트랜잭션 해시: ${txResponse.hash}`);
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert('후원 실패. 다시 시도해 주세요.');
    }
  };

  if (!project) {
    return <p>프로젝트를 찾을 수 없습니다.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/')}>🏠 메인 페이지로</button>
      <h2>📌 프로젝트 상세: {project.title}</h2>
      <p>{project.description}</p>
      <p>🗓️ 마감 날짜: {project.deadline}</p>
      <p>🎯 목표 금액: {project.targetAmount} ETH</p>
      <p>💰 현재 모인 금액: {fundedAmount} ETH</p>
      <input
        type="number"
        placeholder="후원 금액 (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleFund} style={{ marginLeft: '1rem' }}>
        💸 후원하기
      </button>
    </div>
  );
}

export default ProjectDetail;
