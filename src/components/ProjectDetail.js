// ProjectDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract'; // 추출한 계약의 주소를 그대로 사용
import { isFundableStatus, getStatusLabel } from '../utils/statusUtils';  // 프로젝트 진행 상태를 문자로 표현

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('⏳ 로딩 중...');
  const [amount, setAmount] = useState('');
  const [fundedAmount, setFundedAmount] = useState('0');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
        const data = await contract.projects(id);

        if (!data || data.title === '') {
          setStatus('❌ 프로젝트를 찾을 수 없습니다.');
          return;
        }

        const balance = await contract.getTotalDonated(id);

        setProject({
          id: data.id.toString(),
          creator: data.creator,
          title: data.title,
          description: data.description,
          goalAmount: ethers.utils.formatEther(data.goalAmount),
          deadline: data.deadline.toNumber(),
          expertReviewRequested: data.expertReviewRequested,
          status: data.status
        });

        setFundedAmount(ethers.utils.formatEther(balance));
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('❌ 오류 발생');
      }
    };

    fetchProject();
  }, [id]);

  const handleFund = async () => {
    if (!window.ethereum) {
      alert('Metamask가 필요합니다.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

      const tx = await contract.donateToProject(project.id, {
        value: ethers.utils.parseEther(amount),
      });

      await tx.wait();
      alert(`후원 성공! Tx Hash: ${tx.hash}`);
      setAmount('');

      // 후원 후 금액 갱신
      const updated = await contract.getTotalDonated(project.id);
      setFundedAmount(ethers.utils.formatEther(updated));
    } catch (err) {
      console.error(err);
      alert('후원 실패');
    }
  };

  if (status) return <p>{status}</p>;
  if (!project) return null;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>📌 {project.title}</h2>
      <p><strong>🆔 ID:</strong> {project.id}</p>
      <p><strong>📝 설명:</strong> {project.description}</p>
      <p><strong>🎯 목표 금액:</strong> {project.goalAmount} ETH</p>
      <p><strong>📅 마감일:</strong> {new Date(project.deadline * 1000).toLocaleString()}</p>
      <p><strong>💰 현재 모금된 금액:</strong> {fundedAmount} ETH</p>
      <p><strong>🧠 전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
      <p><strong>👤 등록자 주소:</strong> {project.creator}</p>
      <p><strong>📍 현재 상태:</strong> {getStatusLabel(project.status)}</p>

      <div style={{ marginTop: '2rem' }}>
        <h3>💸 후원하기</h3>
        <input
          type="number"
          placeholder="후원 금액 (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '1rem' }}
        />
        <button
          onClick={handleFund}
          disabled={!isFundableStatus(project.status)} // ⬅️ 후원 불가능 시 비활성화
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isFundableStatus(project.status) ? '#4CAF50' : '#ccc',
            color: isFundableStatus(project.status) ? '#fff' : '#666',
            cursor: isFundableStatus(project.status) ? 'pointer' : 'not-allowed',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          {isFundableStatus(project.status) ? '💰 후원하기' : '⛔ 후원할 수 없습니다'} {/* ⬅️ 상태별 텍스트 */}
        </button>

        // 후원 마감 버튼 추가
        {window.ethereum && (
          <button
            onClick={async () => {
              try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const userAddress = await signer.getAddress();

                // ✅ 프로젝트 생성자만 마감 가능
                if (userAddress.toLowerCase() !== project.creator.toLowerCase()) {
                  alert('⚠️ 프로젝트 생성자만 후원을 마감할 수 있습니다.');
                  return;
                }

                // ✅ 마감일이 지나야 가능
                const now = Math.floor(Date.now() / 1000);
                const deadlineTimestamp = project.deadline;
                if (now <= deadlineTimestamp) {
                  alert('⚠️ 마감일 이후에만 후원을 마감할 수 있습니다.');
                  return;
                }

                const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

                const totalDonated = await contract.getTotalDonated(project.id);
                const goalAmount = ethers.utils.parseEther(project.goalAmount);

                let tx;

                // ✅ 목표 금액 이상이면 자금 전달
                if (totalDonated.gte(goalAmount)) {
                  tx = await contract.releaseFundsToCreator(project.id, 1);
                  alert('🎉 목표 달성! 자금이 창작자에게 전달됩니다.');
                } else {
                  // ✅ 목표 미달이면 환불 처리
                  tx = await contract.changeProjectStatusAndRefund(project.id, 3); // 3 = FAILED
                  alert('😢 목표 미달! 후원자에게 환불 처리됩니다.');
                }

                await tx.wait();
                window.location.reload(); // 상태 갱신
              } catch (err) {
                console.error(err);
                alert('❌ 후원 마감 중 오류 발생');
              }
            }}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            ⏹️ 후원 마감
          </button>
        )}

        {!isFundableStatus(project.status) && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>
            ※ 현재 상태에서는 후원이 불가능합니다. 상태: <strong>{getStatusLabel(project.status)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
