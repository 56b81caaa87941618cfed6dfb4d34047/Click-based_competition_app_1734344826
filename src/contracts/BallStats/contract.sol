
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BallStats is Ownable {
    using SafeERC20 for IERC20;

    struct Ball {
        address owner;
        uint256 points;
        string nation;
    }

    struct Nation {
        bool exists;
        uint256 points;
    }

    mapping(uint256 => Ball) public balls;
    mapping(address => mapping(string => uint256)) public userPoints;
    mapping(string => Nation) public nations;

    uint256 public constant CLAIM_COST = 0.01 ether;
    uint256 public constant CREATE_NATION_COST = 0.02 ether;
    uint256 public constant JOIN_NATION_COST = 0.005 ether;
    uint256 public constant INITIAL_BALL_POINTS = 100;

    address public nationStatsContract;

    event BallClaimed(uint256 indexed ballId, address indexed owner, string nation);
    event BallAttacked(uint256 indexed ballId, address indexed attacker, uint256 pointsReduced);
    event PointsProvided(uint256 indexed ballId, address indexed provider, uint256 pointsAdded);
    event PointsTransferred(address indexed from, address indexed to, string nation, uint256 points);
    event NationCreated(string indexed nation, address indexed creator);
    event NationJoined(string indexed nation, address indexed member);
    event NationStatsContractUpdated(address indexed newContract);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() Ownable() {
        nationStatsContract = address(0x1234567890123456789012345678901234567890); // Placeholder address
    }

    function setNationStatsContract(address _nationStatsContract) external onlyOwner {
        nationStatsContract = _nationStatsContract;
        emit NationStatsContractUpdated(_nationStatsContract);
    }

    function claimBall(uint256 _ballId, string memory _nation) external payable {
        require(msg.value == CLAIM_COST, "Incorrect payment amount");
        require(balls[_ballId].owner == address(0), "Ball already claimed");
        require(nations[_nation].exists, "Nation does not exist");

        balls[_ballId] = Ball(msg.sender, INITIAL_BALL_POINTS, _nation);
        emit BallClaimed(_ballId, msg.sender, _nation);
    }

    function attackBall(uint256 _ballId, uint256 _points) external {
        require(balls[_ballId].owner != address(0), "Ball does not exist");
        require(balls[_ballId].owner != msg.sender, "Cannot attack own ball");
        require(_points <= userPoints[msg.sender][balls[_ballId].nation], "Insufficient points");

        uint256 reducedPoints = _points < balls[_ballId].points ? _points : balls[_ballId].points;
        balls[_ballId].points -= reducedPoints;
        userPoints[msg.sender][balls[_ballId].nation] -= reducedPoints;

        if (balls[_ballId].points == 0) {
            balls[_ballId].owner = msg.sender;
        }

        emit BallAttacked(_ballId, msg.sender, reducedPoints);
        syncStats(balls[_ballId].nation);
    }

    function providePoints(uint256 _ballId, uint256 _points) external {
        require(balls[_ballId].owner == msg.sender, "Not the ball owner");
        require(_points <= userPoints[msg.sender][balls[_ballId].nation], "Insufficient points");

        balls[_ballId].points += _points;
        userPoints[msg.sender][balls[_ballId].nation] -= _points;

        emit PointsProvided(_ballId, msg.sender, _points);
        syncStats(balls[_ballId].nation);
    }

    function transferPoints(address _to, string memory _nation, uint256 _points) external {
        require(userPoints[msg.sender][_nation] >= _points, "Insufficient points");

        userPoints[msg.sender][_nation] -= _points;
        userPoints[_to][_nation] += _points;

        emit PointsTransferred(msg.sender, _to, _nation, _points);
    }

    function createNation(string memory _nation) external payable {
        require(msg.value == CREATE_NATION_COST, "Incorrect payment amount");
        require(!nations[_nation].exists, "Nation already exists");

        nations[_nation] = Nation(true, 0);
        emit NationCreated(_nation, msg.sender);
    }

    function joinNation(string memory _nation) external payable {
        require(msg.value == JOIN_NATION_COST, "Incorrect payment amount");
        require(nations[_nation].exists, "Nation does not exist");

        emit NationJoined(_nation, msg.sender);
    }

    function syncStats(string memory _nation) internal {
        (bool success, ) = nationStatsContract.call(abi.encodeWithSignature("updateStats(string)", _nation));
        require(success, "Failed to sync stats");
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawn(owner(), balance);
    }

    receive() external payable {
        // Allow the contract to receive ETH
    }
}
