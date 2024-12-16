
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract BallStats is Ownable {
    using SafeMath for uint256;

    struct Ball {
        address owner;
        uint256 nationId;
        uint256 points;
    }

    struct Nation {
        bool exists;
        uint256 memberCount;
    }

    mapping(uint256 => Ball) public balls;
    mapping(uint256 => Nation) public nations;
    uint256 public ballCount;
    uint256 public nationCount;

    uint256 public constant CLAIM_PRICE = 0.01 ether;
    uint256 public constant CREATE_NATION_PRICE = 0.02 ether;
    uint256 public constant JOIN_NATION_PRICE = 0.005 ether;
    uint256 public constant INITIAL_BALL_POINTS = 100;

    event BallClaimed(uint256 indexed ballId, address indexed owner);
    event NationCreated(uint256 indexed nationId, address indexed creator);
    event NationJoined(uint256 indexed nationId, address indexed member);
    event PointsProvided(uint256 indexed ballId, uint256 points);
    event AttackExecuted(uint256 indexed attackerId, uint256 indexed defenderId, uint256 damage);
    event DefenseExecuted(uint256 indexed defenderId, uint256 indexed attackerId, uint256 pointsGained);

    constructor() Ownable() {}

    function claimBall() external payable {
        require(msg.value == CLAIM_PRICE, "Incorrect payment amount");
        ballCount = ballCount.add(1);
        balls[ballCount] = Ball(msg.sender, 0, INITIAL_BALL_POINTS);
        emit BallClaimed(ballCount, msg.sender);
    }

    function createNation() external payable {
        require(msg.value == CREATE_NATION_PRICE, "Incorrect payment amount");
        nationCount = nationCount.add(1);
        nations[nationCount] = Nation(true, 1);
        emit NationCreated(nationCount, msg.sender);
    }

    function joinNation(uint256 _nationId) external payable {
        require(msg.value == JOIN_NATION_PRICE, "Incorrect payment amount");
        require(nations[_nationId].exists, "Nation does not exist");
        nations[_nationId].memberCount = nations[_nationId].memberCount.add(1);
        emit NationJoined(_nationId, msg.sender);
    }

    function providePoints(uint256 _ballId, uint256 _points) external {
        require(balls[_ballId].owner == msg.sender, "Not the ball owner");
        balls[_ballId].points = balls[_ballId].points.add(_points);
        emit PointsProvided(_ballId, _points);
    }

    function attack(uint256 _attackerId, uint256 _defenderId, uint256 _damage) external {
        require(balls[_attackerId].owner == msg.sender, "Not the attacker ball owner");
        require(balls[_attackerId].points >= _damage, "Not enough points to attack");
        require(balls[_defenderId].points >= _damage, "Defender doesn't have enough points");

        balls[_attackerId].points = balls[_attackerId].points.sub(_damage);
        balls[_defenderId].points = balls[_defenderId].points.sub(_damage);

        emit AttackExecuted(_attackerId, _defenderId, _damage);
    }

    function defend(uint256 _defenderId, uint256 _attackerId, uint256 _pointsGained) external {
        require(balls[_defenderId].owner == msg.sender, "Not the defender ball owner");
        require(balls[_attackerId].points >= _pointsGained, "Attacker doesn't have enough points");

        balls[_defenderId].points = balls[_defenderId].points.add(_pointsGained);
        balls[_attackerId].points = balls[_attackerId].points.sub(_pointsGained);

        emit DefenseExecuted(_defenderId, _attackerId, _pointsGained);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
