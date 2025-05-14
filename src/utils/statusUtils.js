// 상태 정보 추가: 숫자를 텍스트로 변환
export const getStatusLabel = (statusCode) => {
    const statuses = ['📢 모금 중', '🚧 진행 중', '✅ 완료됨', '❌ 실패', '🚫 취소됨'];
    return statuses[statusCode] || '알 수 없음';
};