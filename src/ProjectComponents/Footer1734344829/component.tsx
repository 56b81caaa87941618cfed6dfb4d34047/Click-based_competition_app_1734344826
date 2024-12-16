
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0xc0B2E992c8A31455BE8542ED6aB9366217AEF5F3';
const CHAIN_ID = 17000;

const ABI = [
  "function claimBall(uint256 _ballId, string memory _nation) external payable",
  "function providePoints(uint256 _ballId, uint256 _points) external",
  "function attackBall(uint256 _ballId, uint256 _points) external",
  "function transferPoints(address _to, string memory _nation, uint256 _points) external",
  "function createNation(string memory _nation) external payable",
  "function joinNation(string memory _nation) external payable",
  "function balls(uint256) external view returns (address owner, uint256 points, string memory nation)",
  "function userPoints(address, string) external view returns (uint256)"
];

const BallStatsInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [selectedBall, setSelectedBall] = React.useState<number | null>(null);
  const [ballStats, setBallStats] = React.useState<{owner: string, points: string, nation: string} | null>(null);
  const [nation, setNation] = React.useState('');
  const [points, setPoints] = React.useState('');
  const [transferTo, setTransferTo] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [userNationPoints, setUserNationPoints] = React.useState<string>('0');

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
        await getUserPoints(contract, signer);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Error connecting wallet. Please try again.');
    }
  };

  const getUserPoints = async (contract: ethers.Contract, signer: ethers.Signer) => {
    try {
      const address = await signer.getAddress();
      const points = await contract.userPoints(address, nation);
      setUserNationPoints(points.toString());
    } catch (error) {
      console.error('Error getting user points:', error);
      setError('Error getting user points. Please try again.');
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
      const stats = await contract.balls(ballId);
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
      await getUserPoints(contract, contract.signer);
    } catch (error) {
      console.error('Error claiming ball:', error);
      setError('Error claiming ball. Please try again.');
    }
  };

  const providePoints = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract || selectedBall === null) return;
      const tx = await contract.providePoints(selectedBall, points);
      await tx.wait();
      setSuccess(`${points} points provided to ball ${selectedBall}`);
      await getBallStats(selectedBall);
      await getUserPoints(contract, contract.signer);
    } catch (error) {
      console.error('Error providing points:', error);
      setError('Error providing points. Please try again.');
    }
  };

  const attackBall = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract || selectedBall === null) return;
      const tx = await contract.attackBall(selectedBall, points);
      await tx.wait();
      setSuccess(`Ball ${selectedBall} attacked with ${points} points`);
      await getBallStats(selectedBall);
      await getUserPoints(contract, contract.signer);
    } catch (error) {
      console.error('Error attacking ball:', error);
      setError('Error attacking ball. Please try again.');
    }
  };

  const transferPoints = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.transferPoints(transferTo, nation, points);
      await tx.wait();
      setSuccess(`${points} points transferred to ${transferTo} in nation ${nation}`);
      await getUserPoints(contract, contract.signer);
    } catch (error) {
      console.error('Error transferring points:', error);
      setError('Error transferring points. Please try again.');
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

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-5">BallStats Interaction</h1>

      {error && <p className="text-red-500 mb-5">{error}</p>}
      {success && <p className="text-green-500 mb-5">{success}</p>}

      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-3">User Points</h2>
        <p>Your Points in {nation}: {userNationPoints}</p>
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
            <button onClick={providePoints} className="bg-blue-500 text-white p-2 rounded mr-2">Provide Points</button>
            
            <button onClick={attackBall} className="bg-red-500 text-white p-2 rounded">Attack Ball</button>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-3">Transfer Points</h2>
        <input type="text" placeholder="Recipient Address" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full p-2 mb-2 border rounded" />
        <input type="text" placeholder="Nation" value={nation} onChange={(e) => setNation(e.target.value)} className="w-full p-2 mb-2 border rounded" />
        <input type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full p-2 mb-2 border rounded" />
        <button onClick={transferPoints} className="bg-purple-500 text-white p-2 rounded">Transfer Points</button>
      </div>

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
