'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect, ChangeEvent } from 'react';
import styles from './OnboardingScreen.module.css';
import { formatEther } from 'viem';
import { Dashboard } from './Dashboard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function OnboardingScreen() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  // Profile form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const activeWallet = wallets[0];
  const MIN_BALANCE = 0.01;

  // Initialize username from email when component mounts
  useEffect(() => {
    if (user?.email?.address) {
      setUsername(user.email.address.split('@')[0]);
    }
  }, [user]);

  // Check if user has a profile
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!activeWallet) return;
      
      try {
        const response = await fetch(`/api/users/${activeWallet.address}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };
    
    checkUserProfile();
  }, [activeWallet]);

  // Check user's balance
  useEffect(() => {
    const checkBalance = async () => {
      if (!activeWallet) return;
      
      try {
        const provider = await activeWallet.getEthereumProvider();
        
        // Switch to Monad chain
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279f' }], // 10143 in hex
          });
        } catch (switchError) {
          // Chain doesn't exist, add it
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x279f', // 10143 in hex
                  chainName: 'Monad Testnet',
                  nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MONAD',
                    decimals: 18,
                  },
                  rpcUrls: ['https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding Monad chain:', addError);
          }
        }
        
        // Get balance on Monad chain
        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [activeWallet.address, 'latest']
        });
        
        // Convert hex balance to ETH
        const balanceValue = BigInt(balanceHex as string);
        const balanceInEth = formatEther(balanceValue);
        setBalance(balanceInEth);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBalance();
  }, [activeWallet]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!activeWallet) return;
    
    // Validate form
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    setIsCreatingProfile(true);
    
    try {
      let avatarUrl = '';
      let b64image = '';
      
      // If there's an image file, read it and wait for completion
      if (imageFile) {
        avatarUrl = profileImage || '';
        
        // Create a promise to handle the FileReader asynchronously
        b64image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        }); 
      } else {
        alert('No image selected');
        return;
      }
      
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: activeWallet.address,
          username: username.trim(),
          bio: bio.trim() || 'New ChainSocial user',
          avatar: avatarUrl || 'https://placeholder.com',
          b64image: b64image
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create profile');
      }
      
      try {
        const data = await response.json();
        const provider = await activeWallet.getEthereumProvider();
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
            value: "0x0",
            data: data.transactionData,
            from: activeWallet.address,
            gasLimit: data.estimatedGas
          }]
        });
        console.log("Transaction sent:", txHash);
        console.log("Profile created successfully", data);
        
        // Show success toast with transaction link
        toast.success(
          <div>
            Successfully created account! 
            <a 
              href={`https://explorer.monad.network/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ marginLeft: '5px', color: '#4caf50', textDecoration: 'underline' }}
            >
              See transaction
            </a>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        setHasProfile(true);
      } catch (error) {
        console.error("Error creating profile:", error);
        toast.error("Error creating account, please try again", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error("Failed to create your profile. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Show loading state
  if (isLoading || checkingProfile) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Loading wallet information...</h2>
        </div>
      </div>
    );
  }

  const hasEnoughBalance = parseFloat(balance) >= MIN_BALANCE;

  // If user has enough balance and already has a profile, show dashboard
  if (hasEnoughBalance && hasProfile) {
    return <Dashboard />;
  }

  // If user has enough balance but no profile, show create account page
  // If user doesn't have enough balance, show deposit required page
  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome to ChainSocial!</h2>
        
        <div className={styles.walletInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Your Wallet Address:</span>
            <span className={styles.value}>{activeWallet.address}</span>
          </div>
          
          <div className={styles.infoRow}>
            <span className={styles.label}>Balance:</span>
            <span className={styles.value}>{balance} MONAD</span>
          </div>
        </div>

        {!hasEnoughBalance && (
          <div className={styles.depositMessage}>
            <h3>Deposit Required</h3>
            <p>
              You need to deposit at least {MIN_BALANCE} MONAD to your wallet to continue.
              This is required to interact with the platform.
            </p>
            <button className={styles.copyButton} onClick={() => {
              navigator.clipboard.writeText(activeWallet.address);
              alert('Address copied to clipboard!');
            }}>
              Copy Address
            </button>
          </div>
        )}

        {hasEnoughBalance && !hasProfile && (
          <div className={styles.profileForm}>
            <h3>Create Your Profile</h3>
            <p className={styles.formIntro}>
              Set up your ChainSocial profile to get started.
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                maxLength={30}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="bio" className={styles.label}>Bio</label>
              <textarea
                id="bio"
                className={styles.textarea}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={160}
              />
              <div className={styles.charCount}>{bio.length}/160</div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Profile Picture</label>
              <div className={styles.imageUpload}>
                <div 
                  className={styles.imagePreview}
                  style={{ backgroundImage: profileImage ? `url(${profileImage})` : 'none' }}
                >
                  {!profileImage && <span>No image selected</span>}
                </div>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.fileInput}
                />
                <label htmlFor="profile-image" className={styles.fileInputLabel}>
                  Choose Image
                </label>
              </div>
            </div>
            
            <button 
              className={styles.continueButton}
              onClick={handleContinue}
              disabled={isCreatingProfile || !username.trim()}
            >
              {isCreatingProfile ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        )}
        
        <button onClick={logout} className={styles.logoutButton}>
          Sign Out
        </button>
      </div>
    </div>
  );
} 