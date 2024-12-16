
import React from 'react';
import * as ethers from 'ethers';

const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_nationName",
        "type": "string"
      }
    ],
    "name": "createNation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_nationName",
        "type": "string"
      }
    ],
    "name": "joinNation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_nationName",
        "type": "string"
      }
    ],
    "name": "getStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "attackingPoints",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ballCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const Hero: React.FC = () => {
  const [account, setAccount] = React.useState<string | null>(null);
  const [nationName, setNationName] = React.useState<string>('');
  const [attackingPoints, setAttackingPoints] = React.useState<number>(0);
  const [ballCount, setBallCount] = React.useState<number>(0);

  const contractAddress = '0xeD0316730198ECF315C78Ba64A88f95f9e92Cc1f';
  const chainId = 17000;

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const network = await provider.getNetwork();
        if (network.chainId !== chainId) {
          await switchNetwork();
        }

        await fetchUserStats();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      console.error('Ethereum object not found, install MetaMask.');
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(chainId) }],
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!account) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    try {
      const stats = await contract.getStats(nationName);
      setAttackingPoints(stats.attackingPoints.toNumber());
      setBallCount(stats.ballCount.toNumber());
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  React.useEffect(() => {
    if (account) {
      fetchUserStats();
    }
  }, [account, nationName]);

  return (
    <div className="bg-black w-full h-full relative p-5">
      <div className="absolute top-4 right-4">
        <img src={`https://raw.githubusercontent.com/56b81caaa87941618cfed6dfb4d34047/Click-based_competition_app_1734344826/${window.MI_PROJECT_GIT_REF || 'main'}/src/assets/images/389974a757ba43428bf44cb404b414a3.jpeg`} alt="Hero" className="w-16 h-16 rounded-full" />
      </div>
      <div className="text-white">
        {!account ? (
          <button onClick={connectWallet} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Connect Wallet
          </button>
        ) : (
          <div>
            <p className="mb-2">Connected: {account}</p>
            <input
              type="text"
              value={nationName}
              onChange={(e) => setNationName(e.target.value)}
              placeholder="Enter your nation name"
              className="mb-2 p-2 text-black rounded"
            />
            <button onClick={fetchUserStats} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2">
              Fetch Stats
            </button>
            {nationName && (
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-2">Nation Stats</h2>
                <p>Nation: {nationName}</p>
                <p>Attacking Points: {attackingPoints}</p>
                <p>Ball Count: {ballCount}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { Hero as component };
