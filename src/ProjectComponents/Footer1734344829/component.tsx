
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
  "function getNationStats(string memory _nation) external view returns (uint256 memberCount, uint256 totalPoints)"
];

const BallStatsInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [ballId, setBallId] = React.useState('');
  const [nation, setNation] = React.useState('');
  const [points, setPoints] = React.useState('');
  const [attackerBallId, setAttackerBallId] = React.useState('');
  const [targetBallId, setTargetBallId] = React.useState('');
  const [pointsToReduce, setPointsToReduce] = React.useState('');
  const [ballStats, setBallStats] = React.useState<{owner: string, points: string, nation: string} | null>(null);
  const [nationStats, setNationStats] = React.useState<{memberCount: string, totalPoints: string} | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

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
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Error connecting wallet. Please try again.');
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

  const claimBall = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.claimBall(ballId, nation, { value: ethers.utils.parseEther('0.01') });
      await tx.wait();
      setSuccess(`Ball ${ballId} claimed for nation ${nation}`);
    } catch (error) {
      console.error('Error claiming ball:', error);
      setError('Error claiming ball. Please try again.');
    }
  };

  const provideBallPoints = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.provideBallPoints(ballId, points);
      await tx.wait();
      setSuccess(`${points} points provided to ball ${ballId}`);
    } catch (error) {
      console.error('Error providing points:', error);
      setError('Error providing points. Please try again.');
    }
  };

  const attackBall = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.attackBall(attackerBallId, targetBallId, pointsToReduce);
      await tx.wait();
      setSuccess(`Ball ${attackerBallId} attacked ball ${targetBallId} with ${pointsToReduce} points`);
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
    } catch (error) {
      console.error('Error joining nation:', error);
      setError('Error joining nation. Please try again.');
    }
  };

  const getBallStats = async () => {
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

  const getNationStats = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const stats = await contract.getNationStats(nation);
      setNationStats({
        memberCount: stats[0].toString(),
        totalPoints: stats[1].toString()
      });
    } catch (error) {
      console.error('Error getting nation stats:', error);
      setError('Error getting nation stats. Please try again.');
    }
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-5">BallStats Interaction</h1>
      
      {error && <p className="text-red-500 mb-5">{error}</p>}
      {success && <p className="text-green-500 mb-5">{success}</p>}

      <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded mb-5">
        Connect Wallet
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Claim Ball</h2>
          <input type="number" placeholder="Ball ID" value={ballId} onChange={(e) => setBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <input type="text" placeholder="Nation" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={claimBall} className="bg-green-500 text-white p-2 rounded">Claim Ball</button>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Provide Ball Points</h2>
          <input type="number" placeholder="Ball ID" value={ballId} onChange={(e) => setBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <input type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={provideBallPoints} className="bg-green-500 text-white p-2 rounded">Provide Points</button>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Attack Ball</h2>
          <input type="number" placeholder="Attacker Ball ID" value={attackerBallId} onChange={(e) => setAttackerBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <input type="number" placeholder="Target Ball ID" value={targetBallId} onChange={(e) => setTargetBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <input type="number" placeholder="Points to Reduce" value={pointsToReduce} onChange={(e) => setPointsToReduce(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={attackBall} className="bg-red-500 text-white p-2 rounded">Attack Ball</button>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Create Nation</h2>
          <input type="text" placeholder="Nation Name" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={createNation} className="bg-purple-500 text-white p-2 rounded">Create Nation</button>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Join Nation</h2>
          <input type="text" placeholder="Nation Name" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={joinNation} className="bg-yellow-500 text-white p-2 rounded">Join Nation</button>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Get Ball Stats</h2>
          <input type="number" placeholder="Ball ID" value={ballId} onChange={(e) => setBallId(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={getBallStats} className="bg-blue-500 text-white p-2 rounded mb-2">Get Ball Stats</button>
          {ballStats && (
            <div>
              <p>Owner: {ballStats.owner}</p>
              <p>Points: {ballStats.points}</p>
              <p>Nation: {ballStats.nation}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Get Nation Stats</h2>
          <input type="text" placeholder="Nation Name" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={getNationStats} className="bg-blue-500 text-white p-2 rounded mb-2">Get Nation Stats</button>
          {nationStats && (
            <div>
              <p>Member Count: {nationStats.memberCount}</p>
              <p>Total Points: {nationStats.totalPoints}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { BallStatsInteraction as component };
