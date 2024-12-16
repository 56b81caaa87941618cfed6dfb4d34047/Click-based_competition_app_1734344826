
import React from 'react';
import { ethers } from 'ethers';

const NationStatsHeader: React.FC = () => {
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [account, setAccount] = React.useState('');
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [createNationName, setCreateNationName] = React.useState('');
  const [joinNationName, setJoinNationName] = React.useState('');
  const [viewNationName, setViewNationName] = React.useState('');
  const [nationStats, setNationStats] = React.useState<{ attackingPoints: string; ballCount: string } | null>(null);
  const [status, setStatus] = React.useState('');

  const contractAddress = '0xeD0316730198ECF315C78Ba64A88f95f9e92Cc1f';
  const chainIdRequired = 17000;
  const abi = [
    "function createNation(string memory _nationName) external payable",
    "function joinNation(string memory _nationName) external payable",
    "function getStats(string memory _nationName) external view returns (uint256 attackingPoints, uint256 ballCount)"
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
        setStatus('Creating nation... Please wait.');
        await tx.wait();
        setStatus(`Nation "${createNationName}" created successfully!`);
        setCreateNationName('');
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
    if (joinNationName && walletConnected && chainId === chainIdRequired) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.joinNation(joinNationName, { value: ethers.utils.parseEther("0.005") });
        setStatus('Joining nation... Please wait.');
        await tx.wait();
        setStatus(`Successfully joined nation "${joinNationName}"!`);
        setJoinNationName('');
      } catch (error) {
        console.error('Error joining nation:', error);
        setStatus('Failed to join nation. Please try again.');
      }
    }
  };

  const getStats = async () => {
    if (!walletConnected) {
      await connectWallet();
    }
    if (chainId !== chainIdRequired) {
      await switchChain();
    }
    if (viewNationName && walletConnected && chainId === chainIdRequired) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const [attackingPoints, ballCount] = await contract.getStats(viewNationName);
        setNationStats({
          attackingPoints: attackingPoints.toString(),
          ballCount: ballCount.toString()
        });
        setStatus(`Stats retrieved for nation "${viewNationName}".`);
      } catch (error) {
        console.error('Error getting stats:', error);
        setStatus('Failed to get nation stats. Please try again.');
      }
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            Create Nation (0.02 ETH)
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Join Nation</h2>
          <input
            type="text"
            value={joinNationName}
            onChange={(e) => setJoinNationName(e.target.value)}
            placeholder="Nation Name"
            className="w-full p-2 mb-2 border rounded"
          />
          <button onClick={joinNation} className="bg-yellow-500 text-white px-4 py-2 rounded w-full">
            Join Nation (0.005 ETH)
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">View Nation Stats</h2>
          <input
            type="text"
            value={viewNationName}
            onChange={(e) => setViewNationName(e.target.value)}
            placeholder="Nation Name"
            className="w-full p-2 mb-2 border rounded"
          />
          <button onClick={getStats} className="bg-purple-500 text-white px-4 py-2 rounded w-full">
            Get Stats
          </button>
        </div>
      </div>

      {nationStats && (
        <div className="mt-5 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Nation Stats:</h3>
          <p>Attacking Points: {nationStats.attackingPoints}</p>
          <p>Ball Count: {nationStats.ballCount}</p>
        </div>
      )}

      {status && (
        <div className="mt-5 p-4 bg-blue-100 text-blue-700 rounded">
          {status}
        </div>
      )}
    </div>
  );
};

export { NationStatsHeader as component };
