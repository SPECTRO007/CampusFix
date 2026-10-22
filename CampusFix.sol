// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CampusFix {
    address public admin;
    uint256 public requestCount;

    enum Status { Submitted, InProgress, Resolved }

    struct MaintenanceRequest {
        uint256 id;
        address reporter;
        string location;
        string description;
        Status status;
        uint256 createdAt;
    }

    mapping(uint256 => MaintenanceRequest) private requests;

    event RequestSubmitted(uint256 indexed id, address indexed reporter, string location, string description);
    event StatusUpdated(uint256 indexed id, Status oldStatus, Status newStatus);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can do this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function submitRequest(string calldata _location, string calldata _description) external returns (uint256) {
        require(bytes(_location).length > 0, "Location is required");
        require(bytes(_location).length <= 100, "Location too long");
        require(bytes(_description).length > 0, "Description is required");
        require(bytes(_description).length <= 500, "Description too long");

        requestCount++;
        requests[requestCount] = MaintenanceRequest({
            id: requestCount,
            reporter: msg.sender,
            location: _location,
            description: _description,
            status: Status.Submitted,
            createdAt: block.timestamp
        });

        emit RequestSubmitted(requestCount, msg.sender, _location, _description);
        return requestCount;
    }

    function updateStatus(uint256 _id, Status _newStatus) external onlyAdmin {
        require(_id > 0 && _id <= requestCount, "Invalid request ID");
        MaintenanceRequest storage request = requests[_id];
        require(uint256(_newStatus) <= uint256(Status.Resolved), "Invalid status");
        require(uint256(_newStatus) != uint256(request.status), "Status unchanged");

        Status oldStatus = request.status;
        request.status = _newStatus;
        emit StatusUpdated(_id, oldStatus, _newStatus);
    }

    function getRequest(uint256 _id) external view returns (MaintenanceRequest memory) {
        require(_id > 0 && _id <= requestCount, "Invalid request ID");
        return requests[_id];
    }
}
