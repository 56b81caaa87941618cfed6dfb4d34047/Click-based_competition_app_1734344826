
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0xdF2479bF43DA38bfe9aC8465Ad6Bcb70FF8cd3Ea';
const CHAIN_ID = 17000;

const ABI = [
  "function claimBall(uint256 _ballId, string memory _nation) external payable",
  "function provideBallPoints(uint256 _ballId, uint256 _points) external",
  "function attackBall(uint256 _attackerBallId, uint256 _targetBallId, uint256 _pointsToReduce) external",
  "function createNation(string memory _nation) external payable",
  "function joinNation(string memory _nation) external payable",
  "function getBallStats(uint256 _ballId) external view returns (address owner, uint256 points, string memory nation)",
  "function getNationStats(string memory _nation) external view returns (uint256 memberCount, uint256 totalPoints)",
  "function userNation(address user) external view returns (string memory)"
];

const BallStatsInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [selectedBall, setSelectedBall] = React.useState<number | null>(null);
  const [ballStats, setBallStats] = React.useState<{owner: string, points: string, nation: string} | null>(null);
  const [nation, setNation] = React.useState('');
  const [points, setPoints] = React.useState('');
  const [targetBallId, setTargetBallId] = React.useState('');
  const [pointsToReduce, setPointsToReduce] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [userNation, setUserNation] = React.useState('');
  const [nationStats, setNationStats] = React.useState<{memberCount: string, totalPoints: string} | null>(null);

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        await ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(ethereum);
        setProvider(provider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contract);
        await getUserNation(contract, signer);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Error connecting wallet. Please try again.');
    }
  };

  const getUserNation = async (contract: ethers.Contract, signer: ethers.Signer) => {
    try {
      const address = await signer.getAddress();
      const userNation = await contract.userNation(address);
      setUserNation(userNation);
      if (userNation) {
        await getNationStats(contract, userNation);
      }
    } catch (error) {
      console.error('Error getting user nation:', error);
      setError('Error getting user nation. Please try again.');
    }
  };

  const getNationStats = async (contract: ethers.Contract, nationName: string) => {
    try {
      const stats = await contract.getNationStats(nationName);
      setNationStats({
        memberCount: stats[0].toString(),
        totalPoints: stats[1].toString()
      });
    } catch (error) {
      console.error('Error getting nation stats:', error);
      setError('Error getting nation stats. Please try again.');
    }
  };

  const checkAndSwitchChain = async () => {
    if (!provider) {
      await connectWallet();
      return;
    }
    const network = await provider.getNetwork();
    if (network.chainId !== CHAIN_ID) {
      try {
        await (provider.provider as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }],
        });
      } catch (error) {
        console.error('Error switching network:', error);
        setError('Please switch to the Holesky network in your wallet.');
      }
    }
  };

  const handleBallClick = async (ballId: number) => {
    setSelectedBall(ballId);
    await getBallStats(ballId);
  };

  const getBallStats = async (ballId: number) => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const stats = await contract.getBallStats(ballId);
      setBallStats({
        owner: stats[0],
        points: stats[1].toString(),
        nation: stats[2]
      });
    } catch (error) {
      console.error('Error getting ball stats:', error);
      setError('Error getting ball stats. Please try again.');
    }
  };

  const claimBall = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract || selectedBall === null) return;
      const tx = await contract.claimBall(selectedBall, nation, { value: ethers.utils.parseEther('0.01') });
      await tx.wait();
      setSuccess(`Ball ${selectedBall} claimed for nation ${nation}`);
      await getBallStats(selectedBall);
      await getNationStats(contract, nation);
    } catch (error) {
      console.error('Error claiming ball:', error);
      setError('Error claiming ball. Please try again.');
    }
  };

  const provideBallPoints = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract || selectedBall === null) return;
      const tx = await contract.provideBallPoints(selectedBall, points);
      await tx.wait();
      setSuccess(`${points} points provided to ball ${selectedBall}`);
      await getBallStats(selectedBall);
      await getNationStats(contract, userNation);
    } catch (error) {
      console.error('Error providing points:', error);
      setError('Error providing points. Please try again.');
    }
  };

  const attackBall = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract || selectedBall === null) return;
      const tx = await contract.attackBall(selectedBall, targetBallId, pointsToReduce);
      await tx.wait();
      setSuccess(`Ball ${selectedBall} attacked ball ${targetBallId} with ${pointsToReduce} points`);
      await getBallStats(selectedBall);
      await getNationStats(contract, userNation);
    } catch (error) {
      console.error('Error attacking ball:', error);
      setError('Error attacking ball. Please try again.');
    }
  };

  const createNation = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.createNation(nation, { value: ethers.utils.parseEther('0.02') });
      await tx.wait();
      setSuccess(`Nation ${nation} created`);
      setUserNation(nation);
      await getNationStats(contract, nation);
    } catch (error) {
      console.error('Error creating nation:', error);
      setError('Error creating nation. Please try again.');
    }
  };

  const joinNation = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.joinNation(nation, { value: ethers.utils.parseEther('0.005') });
      await tx.wait();
      setSuccess(`Joined nation ${nation}`);
      setUserNation(nation);
      await getNationStats(contract, nation);
    } catch (error) {
      console.error('Error joining nation:', error);
      setError('Error joining nation. Please try again.');
    }
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-5">BallStats Interaction</h1>

      {error && <p className="text-red-500 mb-5">{error}</p>}
      {success && <p className="text-green-500 mb-5">{success}</p>}

      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-3">User Nation Information</h2>
        {userNation ? (
          <div>
            <p>Your Nation: {userNation}</p>
            {nationStats && (
              <div>
                <p>Member Count: {nationStats.memberCount}</p>
                <p>Total Points: {nationStats.totalPoints}</p>
              </div>
            )}
          </div>
        ) : (
          <p>You haven't joined a nation yet.</p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 mb-5">
        {[...Array(10)].map((_, index) => (
          <img
            key={index}
            src={`https://raw.githubusercontent.com/56b81caaa87941618cfed6dfb4d34047/Click-based_competition_app_1734344826/${window.MI_PROJECT_GIT_REF || 'main'}/src/assets/images/4028adba92904271a467bac9a38ffdbf.jpeg`}
            alt={`Ball ${index + 1}`}
            className="w-full h-auto cursor-pointer rounded-full border-4 border-transparent hover:border-blue-500"
            onClick={() => handleBallClick(index + 1)}
          />
        ))}
      </div>

      {selectedBall !== null && (
        <div className="bg-white p-5 rounded-lg shadow-md mb-5">
          <h2 className="text-xl font-semibold mb-3">Ball {selectedBall} Information</h2>
          {ballStats ? (
            <div>
              <p>Owner: {ballStats.owner}</p>
              <p>Points: {ballStats.points}</p>
              <p>Nation: {ballStats.nation}</p>
            </div>
          ) : (
            <p>Loading ball information...</p>
          )}

          <div className="mt-3">
            <input type="text" placeholder="Nation" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
            <button onClick={claimBall} className="bg-green-500 text-white p-2 rounded mr-2">Claim Ball</button>
            
            <input type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full p-2 mb-2 border rounded" />
            <button onClick={provideBallPoints} className="bg-blue-500 text-white p-2 rounded mr-2">Provide Points</button>
            
            <input type="number" placeholder="Target Ball ID" value={targetBallId} onChange={(e) => setTargetBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
            <input type="number" placeholder="Points to Reduce" value={pointsToReduce} onChange={(e) => setPointsToReduce(e.target.value)} className="w-full p-2 mb-2 border rounded" />
            <button onClick={attackBall} className="bg-red-500 text-white p-2 rounded">Attack Ball</button>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Nation Management</h2>
        <input type="text" placeholder="Nation Name" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
        <button onClick={createNation} className="bg-purple-500 text-white p-2 rounded mr-2">Create Nation</button>
        <button onClick={joinNation} className="bg-yellow-500 text-white p-2 rounded">Join Nation</button>
      </div>
    </div>
  );
};

export { BallStatsInteraction as component };
