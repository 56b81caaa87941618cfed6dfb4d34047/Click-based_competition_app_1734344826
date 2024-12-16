
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract BallStats is Ownable {
    using SafeMath for uint256;

    struct Ball {
        address owner;
        uint256 points;
        string nation;
    }

    struct Nation {
        uint256 memberCount;
        uint256 totalPoints;
    }

    mapping(uint256 => Ball) public balls;
    mapping(string => Nation) public nations;
    mapping(address => string) public userNation;

    uint256 public constant CLAIM_COST = 0.01 ether;
    uint256 public constant CREATE_NATION_COST = 0.02 ether;
    uint256 public constant SWITCH_NATION_COST = 0.005 ether;
    uint256 public constant INITIAL_BALL_POINTS = 100;

    event BallClaimed(uint256 indexed ballId, address indexed owner, string nation);
    event PointsProvided(uint256 indexed ballId, uint256 points);
    event BallAttacked(uint256 indexed attackerBallId, uint256 indexed targetBallId, uint256 pointsReduced);
    event NationCreated(string nation, address creator);
    event NationJoined(address user, string nation);
    event OwnershipChanged(uint256 indexed ballId, address indexed newOwner, string newNation);

    constructor() Ownable() {}

    function claimBall(uint256 _ballId, string memory _nation) external payable {
        require(msg.value == CLAIM_COST, "Incorrect payment amount");
        require(balls[_ballId].owner == address(0), "Ball already claimed");
        require(bytes(userNation[msg.sender]).length > 0, "User must belong to a nation");

        balls[_ballId] = Ball(msg.sender, INITIAL_BALL_POINTS, _nation);
        nations[_nation].totalPoints = nations[_nation].totalPoints.add(INITIAL_BALL_POINTS);

        emit BallClaimed(_ballId, msg.sender, _nation);
    }

    function provideBallPoints(uint256 _ballId, uint256 _points) external {
        require(balls[_ballId].owner == msg.sender, "Not the ball owner");

        balls[_ballId].points = balls[_ballId].points.add(_points);
        nations[balls[_ballId].nation].totalPoints = nations[balls[_ballId].nation].totalPoints.add(_points);

        emit PointsProvided(_ballId, _points);
    }

    function attackBall(uint256 _attackerBallId, uint256 _targetBallId, uint256 _pointsToReduce) external {
        require(balls[_attackerBallId].owner == msg.sender, "Not the attacker ball owner");
        require(balls[_targetBallId].owner != address(0), "Target ball does not exist");
        require(balls[_attackerBallId].points >= _pointsToReduce, "Not enough points to attack");

        balls[_attackerBallId].points = balls[_attackerBallId].points.sub(_pointsToReduce);
        nations[balls[_attackerBallId].nation].totalPoints = nations[balls[_attackerBallId].nation].totalPoints.sub(_pointsToReduce);

        if (_pointsToReduce >= balls[_targetBallId].points) {
            uint256 remainingPoints = _pointsToReduce.sub(balls[_targetBallId].points);
            nations[balls[_targetBallId].nation].totalPoints = nations[balls[_targetBallId].nation].totalPoints.sub(balls[_targetBallId].points);
            
            balls[_targetBallId].points = remainingPoints;
            balls[_targetBallId].owner = msg.sender;
            balls[_targetBallId].nation = balls[_attackerBallId].nation;
            
            nations[balls[_attackerBallId].nation].totalPoints = nations[balls[_attackerBallId].nation].totalPoints.add(remainingPoints);

            emit OwnershipChanged(_targetBallId, msg.sender, balls[_attackerBallId].nation);
        } else {
            balls[_targetBallId].points = balls[_targetBallId].points.sub(_pointsToReduce);
            nations[balls[_targetBallId].nation].totalPoints = nations[balls[_targetBallId].nation].totalPoints.sub(_pointsToReduce);
        }

        emit BallAttacked(_attackerBallId, _targetBallId, _pointsToReduce);
    }

    function createNation(string memory _nation) external payable {
        require(msg.value == CREATE_NATION_COST, "Incorrect payment amount");
        require(nations[_nation].memberCount == 0, "Nation already exists");

        nations[_nation].memberCount = 1;
        userNation[msg.sender] = _nation;

        emit NationCreated(_nation, msg.sender);
    }

    function joinNation(string memory _nation) external payable {
        require(nations[_nation].memberCount > 0, "Nation does not exist");
        
        if (bytes(userNation[msg.sender]).length > 0) {
            require(msg.value == SWITCH_NATION_COST, "Incorrect payment amount for switching nation");
            nations[userNation[msg.sender]].memberCount = nations[userNation[msg.sender]].memberCount.sub(1);
        } else {
            require(msg.value == 0, "Payment not required for first join");
        }

        userNation[msg.sender] = _nation;
        nations[_nation].memberCount = nations[_nation].memberCount.add(1);

        emit NationJoined(msg.sender, _nation);
    }

    function getBallStats(uint256 _ballId) external view returns (address owner, uint256 points, string memory nation) {
        Ball memory ball = balls[_ballId];
        return (ball.owner, ball.points, ball.nation);
    }

    function getNationStats(string memory _nation) external view returns (uint256 memberCount, uint256 totalPoints) {
        Nation memory nation = nations[_nation];
        return (nation.memberCount, nation.totalPoints);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
