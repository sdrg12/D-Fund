// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DFund {
    uint public projectCount = 0;   // 전체 등록된 프로젝트 수

    enum ProjectStatus {    // 프로젝트 진행 상태
        FUNDRAISING,   // 0: 모금 중
        IN_PROGRESS,    // 1: 프로젝트 진행 중
        COMPLETED,     // 2: 프로젝트 정상 완료
        FAILED,        // 3: 실패 (모금 실패 또는 중단)
        CANCELLED      // 4: 자발적 취소
    }

    struct Project {    // 프로젝트 구조체 정의
        uint id;
        address creator;
        string title;
        string description;
        uint goalAmount;              // 단위: wei
        uint deadline;                // Unix timestamp
        bool expertReviewRequested;
        bool isActive;
        ProjectStatus status;
    }

    struct FundBalance {                  // ✅ 프로젝트별 자금 상태
        uint totalDonated;               // ✅ 전체 후원액
        uint transferredToCreator;       // ✅ 창작자에게 전달된 총액
    }

    mapping(uint => Project) public projects;
    mapping(uint => FundBalance) public projectFunds;                         // ✅ 프로젝트별 자금
    mapping(uint => mapping(address => uint)) public donorBalances;           // ✅ 프로젝트별 후원자 잔액
    mapping(uint => address[]) public projectDonors;                          // ✅ 프로젝트별 후원자 목록
    mapping(uint => mapping(address => bool)) public hasDonated;             // ✅ 후원자 중복 체크

    // 프로젝트 등록 이벤트
    event ProjectRegistered(
        uint indexed id,
        address indexed creator,
        string title,
        uint goalAmount,
        uint deadline,
        bool expertReviewRequested
    );

    // 프로젝트 등록
    function registerProject(
        string memory _title,
        string memory _description,
        uint _goalAmount,
        uint _deadline,
        bool _expertReviewRequested
    ) public {
        // 입력되지 않거나 잘못 입력되었을 경우
        require(bytes(_title).length > 0, "Title is required.");
        require(bytes(_description).length > 0, "Description is required.");
        require(_goalAmount > 0, "Goal amount must be greater than zero.");
        require(_deadline > block.timestamp, "Deadline must be a future time.");

        projectCount++;

        projects[projectCount] = Project({
            id: projectCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            goalAmount: _goalAmount,
            deadline: _deadline,
            expertReviewRequested: _expertReviewRequested,
            isActive: true,
            status: ProjectStatus.FUNDRAISING   // 여기 다른걸로 바꾸면 후원 버튼 막힘
        });

        emit ProjectRegistered(
            projectCount,
            msg.sender,
            _title,
            _goalAmount,
            _deadline,
            _expertReviewRequested
        );
    }

    // 특정 ID의 프로젝트 정보 조회
    function getProject(uint _id) public view returns (
    uint id,
    address creator,
    string memory title,
    string memory description,
    uint goalAmount,
    uint deadline,
    bool expertReviewRequested,
    ProjectStatus status
    ) {
        Project memory p = projects[_id];
        return (
            p.id,
            p.creator,
            p.title,
            p.description,
            p.goalAmount,
            p.deadline,
            p.expertReviewRequested,
            p.status
        );
    }

    // 전체 프로젝트 조회
    function getAllProjects() public view returns (Project[] memory) {
        Project[] memory result = new Project[](projectCount);
        for (uint i = 1; i <= projectCount; i++) {
            result[i - 1] = projects[i];
        }
        return result;
    }

    // 프로젝트 후원
    function donateToProject(uint _projectId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(projects[_projectId].isActive, "Invalid project");
        require(projects[_projectId].status == ProjectStatus.FUNDRAISING, "Project not fundraising");

        donorBalances[_projectId][msg.sender] += msg.value;                         // ✅ 후원자 잔액 증가
        projectFunds[_projectId].totalDonated += msg.value;                         // ✅ 전체 후원액 증가

        if (!hasDonated[_projectId][msg.sender]) {                                  // ✅ 중복 체크 후 후원자 목록 등록
            projectDonors[_projectId].push(msg.sender);
            hasDonated[_projectId][msg.sender] = true;
        }
    }

    // ✅ 창작자에게 후원금의 일부를 송금 (비율 입력: 0 ~ 1)
    function releaseFundsToCreator(uint _projectId, uint _percent) external {
        require(_percent <= 1, "Invalid percentage");
        Project storage project = projects[_projectId];
        require(project.creator == msg.sender, "Only creator can withdraw");

        FundBalance storage fund = projectFunds[_projectId];
        uint available = fund.totalDonated - fund.transferredToCreator;
        require(available > 0, "No available funds");

        uint payout = available * _percent;
        require(payout > 0, "Payout too small");

        address[] memory backers = projectDonors[_projectId];
        for (uint i = 0; i < backers.length; i++) {
            address donor = backers[i];
            uint donorShare = donorBalances[_projectId][donor];
            if (donorShare > 0) {
                uint reduction = donorShare * _percent;                   // 🔄 각 후원자의 잔액에서 차감
                donorBalances[_projectId][donor] -= reduction;
            }
        }

        // ✅ 상태가 IN_PROGRESS가 아니면 자동 변경
        if (project.status != ProjectStatus.IN_PROGRESS) {
            project.status = ProjectStatus.IN_PROGRESS;
    }

        fund.transferredToCreator += payout;                                       // ✅ 누적 송금액 증가
        payable(project.creator).transfer(payout);                                 // ✅ 실제 송금
    }

    // ✅ 특정 프로젝트에서 후원자의 현재 잔여 후원금
    function getDonorBalance(uint _projectId, address _donor) public view returns (uint) {
        return donorBalances[_projectId][_donor];
    }

    // ✅ 프로젝트별 총 후원금
    function getTotalDonated(uint _projectId) public view returns (uint) {
        return projectFunds[_projectId].totalDonated;
        }

    // ✅ 프로젝트별 남은 총 후원금
    function getRemainingFunds(uint _projectId) public view returns (uint) {
        FundBalance memory f = projectFunds[_projectId];
        return f.totalDonated - f.transferredToCreator;
    }

    // FAILED(3) 또는 CANCELLED(4)로 상태 변경 및 후원금 환불불
    function changeProjectStatusAndRefund(uint _projectId, uint8 newStatus) external {
        require(newStatus == uint8(ProjectStatus.FAILED) || newStatus == uint8(ProjectStatus.CANCELLED), "Only FAILED or CANCELLED allowed");

        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only creator can change status");
        require(project.isActive, "Project already inactive");

        // 상태 변경
        project.status = ProjectStatus(newStatus);
        project.isActive = false;

        // 환불 실행
        address[] memory backers = projectDonors[_projectId];
        for (uint i = 0; i < backers.length; i++) {
            address donor = backers[i];
            uint amount = donorBalances[_projectId][donor];
            if (amount > 0) {
                donorBalances[_projectId][donor] = 0;
                payable(donor).transfer(amount);
            }
        }
    }

    // 후원 기간 마감 시 상태 변화 및 자금의 이동은 트랜잭션이 등록되어야만 진행할 수 있음. 즉, 자동으로 진행되지 않음.
    // 그런다고 환불 과정에서 사용되는 가스비를 후원자에게 부담하라고 할 수는 없음.
    // 그러면, 창작자가 프로젝트를 등록할 때 보증금(예: 목표금액의 1%)을 예치하고,
    // 프로젝트가 실패하였을 때 창작자가 환불 트랜잭션을 발생해야만 보증금이 반환되도록 하면 어떨까?

    // 일단 현재 프로젝트 상태를 나타낼 수 있도록 /utils/statusUtils.js 파일을 만들어 둠.
    // 위 내용을 고민하면서, 시간이 되면 ProjectDetail.js에서 후원 기간이 지난 프로젝트에 후원하는 것을 막을 예정임.

}
