
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0xeD0316730198ECF315C78Ba64A88f95f9e92Cc1f';
const CHAIN_ID = 17000;

const ABI = [
  "function createNation(string memory _nationName) external payable",
  "function joinNation(string memory _nationName) external payable",
  "function getStats(string memory _nationName) external view returns (uint256 attackingPoints, uint256 ballCount)",
  "function nationStats(string) external view returns (uint256 attackingPoints, uint256 ballCount)",
  "function hasCreatedNation(address) external view returns (bool)"
];

const NationStatsInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [nationName, setNationName] = React.useState('');
  const [nationStats, setNationStats] = React.useState<{attackingPoints: string, ballCount: string} | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [hasCreated, setHasCreated] = React.useState(false);

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
        await checkHasCreatedNation(contract, signer);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Error connecting wallet. Please try again.');
    }
  };

  const checkHasCreatedNation = async (contract: ethers.Contract, signer: ethers.Signer) => {
    try {
      const address = await signer.getAddress();
      const created = await contract.hasCreatedNation(address);
      setHasCreated(created);
    } catch (error) {
      console.error('Error checking if user has created nation:', error);
      setError('Error checking user status. Please try again.');
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

  const createNation = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.createNation(nationName, { value: ethers.utils.parseEther('0.02') });
      await tx.wait();
      setSuccess(`Nation ${nationName} created`);
      setHasCreated(true);
    } catch (error) {
      console.error('Error creating nation:', error);
      setError('Error creating nation. Please try again.');
    }
  };

  const joinNation = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const tx = await contract.joinNation(nationName, { value: ethers.utils.parseEther('0.005') });
      await tx.wait();
      setSuccess(`Joined nation ${nationName}`);
    } catch (error) {
      console.error('Error joining nation:', error);
      setError('Error joining nation. Please try again.');
    }
  };

  const getNationStats = async () => {
    try {
      await checkAndSwitchChain();
      if (!contract) return;
      const stats = await contract.getStats(nationName);
      setNationStats({
        attackingPoints: stats[0].toString(),
        ballCount: stats[1].toString()
      });
    } catch (error) {
      console.error('Error getting nation stats:', error);
      setError('Error getting nation stats. Please try again.');
    }
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-5">NationStats Interaction</h1>

      {error && <p className="text-red-500 mb-5">{error}</p>}
      {success && <p className="text-green-500 mb-5">{success}</p>}

      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-3">Nation Management</h2>
        <input 
          type="text" 
          placeholder="Nation Name" 
          value={nationName} 
          onChange={(e) => setNationName(e.target.value)} 
          className="w-full p-2 mb-2 border rounded"
        />
        {!hasCreated && (
          <button 
            onClick={createNation} 
            className="bg-purple-500 text-white p-2 rounded mr-2"
          >
            Create Nation (0.02 ETH)
          </button>
        )}
        <button 
          onClick={joinNation} 
          className="bg-yellow-500 text-white p-2 rounded"
        >
          Join Nation (0.005 ETH)
        </button>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-3">View Nation Stats</h2>
        <input 
          type="text" 
          placeholder="Nation Name" 
          value={nationName} 
          onChange={(e) => setNationName(e.target.value)} 
          className="w-full p-2 mb-2 border rounded"
        />
        <button 
          onClick={getNationStats} 
          className="bg-blue-500 text-white p-2 rounded"
        >
          Get Stats
        </button>
        {nationStats && (
          <div className="mt-3">
            <p>Attacking Points: {nationStats.attackingPoints}</p>
            <p>Ball Count: {nationStats.ballCount}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { NationStatsInteraction as component };
