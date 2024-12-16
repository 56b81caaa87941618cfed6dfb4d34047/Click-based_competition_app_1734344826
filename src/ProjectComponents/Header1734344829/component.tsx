
import React from 'react';
import { ethers } from 'ethers';

const NationStatsHeader: React.FC = () => {
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [account, setAccount] = React.useState('');
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [createNationName, setCreateNationName] = React.useState('');
  const [joinNationId, setJoinNationId] = React.useState('');
  const [allNationStats, setAllNationStats] = React.useState<{ [key: number]: { name: string; population: string; wealth: string; power: string } }>({});
  const [status, setStatus] = React.useState('');
  const [knownNationIds, setKnownNationIds] = React.useState<number[]>([]);

  const contractAddress = '0x5434a0106734EACE526432a4Bd71a799d53ad95e';
  const chainIdRequired = 17000;
  const abi = [
    "function createNation(string memory _name) external payable",
    "function joinNation(uint256 _nationId) external payable",
    "function getNationStats(uint256 _nationId) external view returns (string memory, uint256, uint256, uint256)"
  ];

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setWalletConnected(true);
        
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setStatus('Failed to connect wallet.');
      }
    } else {
      setStatus('Please install MetaMask!');
    }
  };

  const switchChain = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainIdRequired.toString(16)}` }],
        });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setStatus('Failed to switch to the correct network.');
      }
    }
  };

  const createNation = async () => {
    if (!walletConnected) {
      await connectWallet();
    }
    if (chainId !== chainIdRequired) {
      await switchChain();
    }
    if (createNationName && walletConnected && chainId === chainIdRequired) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.createNation(createNationName, { value: ethers.utils.parseEther("0.02") });
        setStatus('Creating nation and minting NFT... Please wait.');
        await tx.wait();
        setStatus(`Nation "${createNationName}" created successfully and NFT minted!`);
        setCreateNationName('');
        fetchAllNationStats();
      } catch (error) {
        console.error('Error creating nation:', error);
        setStatus('Failed to create nation. Please try again.');
      }
    }
  };

  const joinNation = async () => {
    if (!walletConnected) {
      await connectWallet();
    }
    if (chainId !== chainIdRequired) {
      await switchChain();
    }
    if (joinNationId && walletConnected && chainId === chainIdRequired) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.joinNation(joinNationId, { value: ethers.utils.parseEther("0.005") });
        setStatus('Joining nation and minting NFT... Please wait.');
        await tx.wait();
        setStatus(`Successfully joined nation with ID ${joinNationId} and NFT minted!`);
        setKnownNationIds(prev => [...prev, parseInt(joinNationId)]);
        setJoinNationId('');
        fetchAllNationStats();
      } catch (error) {
        console.error('Error joining nation:', error);
        setStatus('Failed to join nation. Please try again.');
      }
    }
  };

  const fetchAllNationStats = async () => {
    if (!walletConnected || chainId !== chainIdRequired) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const stats: { [key: number]: { name: string; population: string; wealth: string; power: string } } = {};

      for (const nationId of knownNationIds) {
        const [name, population, wealth, power] = await contract.getNationStats(nationId);
        stats[nationId] = {
          name,
          population: population.toString(),
          wealth: wealth.toString(),
          power: power.toString()
        };
      }

      setAllNationStats(stats);
    } catch (error) {
      console.error('Error fetching all nation stats:', error);
      setStatus('Failed to fetch nation stats. Please try again.');
    }
  };

  React.useEffect(() => {
    if (walletConnected && chainId === chainIdRequired) {
      fetchAllNationStats();
    }
  }, [walletConnected, chainId, knownNationIds]);

  return (
    <div className="bg-gray-100 p-5 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Nation Stats</h1>
        <div>
          {walletConnected ? (
            <p className="text-sm">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          ) : (
            <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-semibold mb-2">All Nation Stats</h2>
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Nation ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Population</th>
              <th className="p-2 text-left">Wealth</th>
              <th className="p-2 text-left">Power</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(allNationStats).map(([nationId, stats]) => (
              <tr key={nationId} className="border-b">
                <td className="p-2">{nationId}</td>
                <td className="p-2">{stats.name}</td>
                <td className="p-2">{stats.population}</td>
                <td className="p-2">{stats.wealth}</td>
                <td className="p-2">{stats.power}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Create Nation</h2>
          <input
            type="text"
            value={createNationName}
            onChange={(e) => setCreateNationName(e.target.value)}
            placeholder="Nation Name"
            className="w-full p-2 mb-2 border rounded"
          />
          <button onClick={createNation} className="bg-green-500 text-white px-4 py-2 rounded w-full">
            Create Nation and Mint NFT (0.02 ETH)
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Join Nation</h2>
          <input
            type="number"
            value={joinNationId}
            onChange={(e) => setJoinNationId(e.target.value)}
            placeholder="Nation ID"
            className="w-full p-2 mb-2 border rounded"
          />
          <button onClick={joinNation} className="bg-yellow-500 text-white px-4 py-2 rounded w-full">
            Join Nation and Mint NFT (0.005 ETH)
          </button>
        </div>
      </div>

      {status && (
        <div className="mt-5 p-4 bg-blue-100 text-blue-700 rounded">
          {status}
        </div>
      )}
    </div>
  );
};

export { NationStatsHeader as component };
