
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NationStats is ERC721, Ownable {
    using Counters for Counters.Counter;

    struct Nation {
        string name;
        uint256 population;
        uint256 wealth;
        uint256 power;
    }

    mapping(uint256 => Nation) public nations;
    mapping(string => bool) public nationNameExists;
    Counters.Counter private _tokenIds;
    Counters.Counter private _nationIds;

    uint256 public constant CREATE_NATION_COST = 0.02 ether;
    uint256 public constant JOIN_NATION_COST = 0.005 ether;

    address public ballStatsContract;

    event NationCreated(uint256 indexed nationId, string name, address creator);
    event NationJoined(uint256 indexed nationId, address joiner);
    event NationStatsUpdated(uint256 indexed nationId, uint256 population, uint256 wealth, uint256 power);

    constructor() ERC721("NationStats", "NSTAT") Ownable() {
        ballStatsContract = address(0x1234567890123456789012345678901234567890); // Placeholder address
    }

    function createNation(string memory _name) external payable {
        require(msg.value == CREATE_NATION_COST, "Incorrect payment amount");
        require(!nationNameExists[_name], "Nation name already exists");

        _nationIds.increment();
        uint256 newNationId = _nationIds.current();

        nations[newNationId] = Nation(_name, 1, 0, 0);
        nationNameExists[_name] = true;

        _mintNFT(msg.sender, true);

        emit NationCreated(newNationId, _name, msg.sender);
    }

    function joinNation(uint256 _nationId) external payable {
        require(msg.value == JOIN_NATION_COST, "Incorrect payment amount");
        require(_nationId > 0 && _nationId <= _nationIds.current(), "Nation does not exist");

        nations[_nationId].population += 1;

        _mintNFT(msg.sender, false);

        emit NationJoined(_nationId, msg.sender);
    }

    function getNationStats(uint256 _nationId) external view returns (string memory, uint256, uint256, uint256) {
        require(_nationId > 0 && _nationId <= _nationIds.current(), "Nation does not exist");
        Nation memory nation = nations[_nationId];
        return (nation.name, nation.population, nation.wealth, nation.power);
    }

    function updateNationStats(uint256 _nationId, uint256 _population, uint256 _wealth, uint256 _power) external {
        require(msg.sender == ballStatsContract, "Only BallStats contract can update");
        require(_nationId > 0 && _nationId <= _nationIds.current(), "Nation does not exist");

        Nation storage nation = nations[_nationId];
        nation.population = _population;
        nation.wealth = _wealth;
        nation.power = _power;

        emit NationStatsUpdated(_nationId, _population, _wealth, _power);
    }

    function setBallStatsContract(address _ballStatsContract) external onlyOwner {
        ballStatsContract = _ballStatsContract;
    }

    function _mintNFT(address _to, bool _isCreator) internal {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(_to, newTokenId);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
