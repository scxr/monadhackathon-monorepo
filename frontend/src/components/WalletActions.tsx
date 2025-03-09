'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState } from 'react';
import styles from './WalletActions.module.css';

export function WalletActions() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [signature, setSignature] = useState<string>('');
  
  const activeWallet = wallets[0];

  const handleSign = async () => {
    if (!activeWallet) return;
    
    try {
      const message = 'Hello from my dApp!';
      const provider = await activeWallet.getEthereumProvider();
      const sig = await provider.request({
        method: 'personal_sign',
        params: [message, activeWallet.address]
      });
      setSignature(sig as string);
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  const handleTransaction = async () => {
    if (!activeWallet) return;
    
    try {
      const transaction = {
        to: "0x...", // Replace with recipient address
        value: "0x0", // Amount in wei
        data: "0x", // Transaction data
      };
      
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });
      console.log('Transaction sent:', txHash);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };

  if (!activeWallet) {
    return <div>No wallet connected</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <span className={styles.address}>{activeWallet?.address}</span>
        <button onClick={logout} className={styles.logoutButton}>
          Sign Out
        </button>
      </div>

      <div className="space-x-4">
        <button
          onClick={handleSign}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign Message
        </button>
        
        <button
          onClick={handleTransaction}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Send Transaction
        </button>
      </div>

      {signature && (
        <div>
          <h3 className="font-bold">Signature</h3>
          <p className="font-mono break-all">{signature}</p>
        </div>
      )}
    </div>
  );
} 