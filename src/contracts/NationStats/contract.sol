
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract NationStats is Ownable {
    using SafeMath for uint256;

    struct NationStat {
        uint256 attackingPoints;
        uint256 ballCount;
    }

    mapping(string => NationStat) public nationStats;
    mapping(address => bool) public hasCreatedNation;

    uint256 public constant CREATE_NATION_PRICE = 0.02 ether;
    uint256 public constant JOIN_NATION_PRICE = 0.005 ether;

    event NationCreated(string nationName, address creator);
    event NationJoined(string nationName, address joiner);
    event StatsUpdated(string nationName, uint256 attackingPoints, uint256 ballCount);

    constructor() Ownable() {}

    function createNation(string memory _nationName) external payable {
        require(!hasCreatedNation[msg.sender], "You have already created a nation");
        require(msg.value == CREATE_NATION_PRICE, "Incorrect payment amount");
        require(nationStats[_nationName].attackingPoints == 0 && nationStats[_nationName].ballCount == 0, "Nation already exists");

        nationStats[_nationName] = NationStat(0, 0);
        hasCreatedNation[msg.sender] = true;

        emit NationCreated(_nationName, msg.sender);
    }

    function joinNation(string memory _nationName) external payable {
        require(msg.value == JOIN_NATION_PRICE, "Incorrect payment amount");
        require(nationStats[_nationName].attackingPoints > 0 || nationStats[_nationName].ballCount > 0, "Nation does not exist");

        emit NationJoined(_nationName, msg.sender);
    }

    function updateStats(string memory _nationName, uint256 _attackingPoints, uint256 _ballCount) external onlyOwner {
        nationStats[_nationName].attackingPoints = nationStats[_nationName].attackingPoints.add(_attackingPoints);
        nationStats[_nationName].ballCount = nationStats[_nationName].ballCount.add(_ballCount);

        emit StatsUpdated(_nationName, nationStats[_nationName].attackingPoints, nationStats[_nationName].ballCount);
    }

    function getStats(string memory _nationName) external view returns (uint256 attackingPoints, uint256 ballCount) {
        NationStat memory stat = nationStats[_nationName];
        return (stat.attackingPoints, stat.ballCount);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
