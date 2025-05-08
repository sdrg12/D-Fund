import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const projects = [
  {
    id: 1,
    title: 'Test 1',
    description: 'This is donation test 1.',
    targetAmount: 10, // 목표 금액
    deadline: '2025-12-31', // 마감 날짜
    contractAddress: '0xYourContractAddress1', // 스마트 컨트랙트 주소
  },
  {
    id: 2,
    title: 'Test 2',
    description: 'This is donation test 2.',
    targetAmount: 5,
    deadline: '2025-11-30',
    contractAddress: '0xYourContractAddress2',
  },
];

function Main() {
  const [walletAddress, setWalletAddress] = useState('');
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Metamask가 설치되어 있지 않습니다.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      console.error('지갑 연결 실패:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center' }}>🔥 지원 가능한 프로젝트</h2>

      {/* 지갑 연결 버튼 */}
      <button onClick={connectWallet}>
        {walletAddress ? `🔗 ${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}` : '🔗 Connect Wallet'}
      </button>

      {/* 프로젝트 목록 */}
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
        {projects.map((project) => (
          <div
            key={project.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '1rem',
              padding: '1rem',
              width: '250px',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/project/${project.id}`)} // 상세 페이지로 이동
          >
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Main;
