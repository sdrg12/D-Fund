// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DFund {
    uint public projectCount = 0;   // 전체 등록된 프로젝트 수

    enum ProjectStatus {    // 프로젝트 진행 상태
        FUNDRAISING,   // 0: 모금 중
        IN_PROGRESS,    // 1: 프로젝트 실행 중
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

    mapping(uint => Project) public projects;
    mapping(uint => uint) public projectBalance;

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

        projectBalance[_projectId] += msg.value;
    }

    // 후원 기간 마감 시 상태 변화 및 자금의 이동은 트랜잭션이 등록되어야만 진행할 수 있음. 즉, 자동으로 진행되지 않음.
    // 그런다고 환불 과정에서 사용되는 가스비를 후원자에게 부담하라고 할 수는 없음.
    // 그러면, 창작자가 프로젝트를 등록할 때 보증금(예: 목표금액의 1%)을 예치하고,
    // 프로젝트가 실패하였을 때 창작자가 환불 트랜잭션을 발생해야만 보증금이 반환되도록 하면 어떨까?

    // 일단 현재 프로젝트 상태를 나타낼 수 있도록 /utils/statusUtils.js 파일을 만들어 둠.
    // 위 내용을 고민하면서, 시간이 되면 ProjectDetail.js에서 후원 기간이 지난 프로젝트에 후원하는 것을 막을 예정임.

}
