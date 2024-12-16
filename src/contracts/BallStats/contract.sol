
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract BallStats is Ownable {
    using SafeMath for uint256;

    struct Ball {
        address owner;
        string nation;
        uint256 points;
    }

    struct Nation {
        uint256 members;
        uint256 totalPoints;
    }

    mapping(uint256 => Ball) public balls;
    mapping(string => Nation) public nations;
    mapping(address => string) public userNation;

    uint256 public constant CLAIM_PRICE = 0.01 ether;
    uint256 public constant CREATE_NATION_PRICE = 0.02 ether;
    uint256 public constant SWITCH_NATION_PRICE = 0.005 ether;
    uint256 public constant INITIAL_BALL_POINTS = 100;

    event BallClaimed(uint256 indexed ballId, address indexed owner, string nation);
    event NationCreated(string indexed nation, address indexed creator);
    event NationJoined(address indexed user, string indexed nation);
    event PointsAdded(uint256 indexed ballId, uint256 points);
    event BallAttacked(uint256 indexed attackerBallId, uint256 indexed targetBallId, uint256 pointsReduced);
    event BallTransferred(uint256 indexed ballId, address indexed from, address indexed to);

    constructor() Ownable() {}

    function claimBall(uint256 _ballId, string memory _nation) external payable {
        require(msg.value == CLAIM_PRICE, "Incorrect payment amount");
        require(balls[_ballId].owner == address(0), "Ball already claimed");
        require(bytes(userNation[msg.sender]).length > 0, "User must belong to a nation");

        balls[_ballId] = Ball(msg.sender, _nation, INITIAL_BALL_POINTS);
        nations[_nation].totalPoints = nations[_nation].totalPoints.add(INITIAL_BALL_POINTS);

        emit BallClaimed(_ballId, msg.sender, _nation);
    }

    function createNation(string memory _nation) external payable {
        require(msg.value == CREATE_NATION_PRICE, "Incorrect payment amount");
        require(nations[_nation].members == 0, "Nation already exists");
        require(bytes(userNation[msg.sender]).length == 0, "User already belongs to a nation");

        nations[_nation].members = 1;
        userNation[msg.sender] = _nation;

        emit NationCreated(_nation, msg.sender);
    }

    function joinNation(string memory _nation) external payable {
        require(nations[_nation].members > 0, "Nation does not exist");
        
        if (bytes(userNation[msg.sender]).length > 0) {
            require(msg.value == SWITCH_NATION_PRICE, "Incorrect payment amount for switching nation");
            nations[userNation[msg.sender]].members = nations[userNation[msg.sender]].members.sub(1);
        } else {
            require(msg.value == 0, "Payment not required for first join");
        }

        userNation[msg.sender] = _nation;
        nations[_nation].members = nations[_nation].members.add(1);

        emit NationJoined(msg.sender, _nation);
    }

    function addPointsToBall(uint256 _ballId, uint256 _points) external {
        require(balls[_ballId].owner == msg.sender, "Not the ball owner");

        balls[_ballId].points = balls[_ballId].points.add(_points);
        nations[balls[_ballId].nation].totalPoints = nations[balls[_ballId].nation].totalPoints.add(_points);

        emit PointsAdded(_ballId, _points);
    }

    function attackBall(uint256 _attackerBallId, uint256 _targetBallId, uint256 _points) external {
        require(balls[_attackerBallId].owner == msg.sender, "Not the attacker ball owner");
        require(_attackerBallId != _targetBallId, "Cannot attack own ball");
        require(balls[_attackerBallId].points >= _points, "Insufficient points for attack");

        Ball storage targetBall = balls[_targetBallId];
        uint256 pointsReduced = _points > targetBall.points ? targetBall.points : _points;

        targetBall.points = targetBall.points.sub(pointsReduced);
        nations[targetBall.nation].totalPoints = nations[targetBall.nation].totalPoints.sub(pointsReduced);

        emit BallAttacked(_attackerBallId, _targetBallId, pointsReduced);

        if (targetBall.points == 0) {
            _transferBall(_targetBallId, targetBall.owner, msg.sender);
        }
    }

    function _transferBall(uint256 _ballId, address _from, address _to) internal {
        Ball storage ball = balls[_ballId];
        
        nations[ball.nation].totalPoints = nations[ball.nation].totalPoints.sub(ball.points);
        ball.owner = _to;
        ball.nation = userNation[_to];
        nations[ball.nation].totalPoints = nations[ball.nation].totalPoints.add(ball.points);

        emit BallTransferred(_ballId, _from, _to);
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
