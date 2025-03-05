'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import styles from './Dashboard.module.css';
import { useState, useEffect, FormEvent } from 'react';
import { FaHome, FaSearch, FaBell, FaEnvelope, FaBookmark, FaList, FaUser, FaEllipsisH, FaImage, FaGift, FaPoll, FaSmile, FaCalendar, FaRetweet, FaHeart, FaShareSquare, FaComment } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Dashboard() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [userData, setUserData] = useState<any>(null);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const activeWallet = wallets[0];

  // Sample posts data
  const [posts, setPosts] = useState([
    {
      id: 1,
      username: 'monad_dev',
      handle: '@monad_official',
      avatar: 'https://pbs.twimg.com/profile_images/1639076367933612032/X-4zopIR_400x400.jpg',
      content: 'Excited to announce our latest protocol upgrade! Faster transactions and lower fees coming soon. #MonadBlockchain',
      time: '2h',
      likes: 245,
      comments: 34,
      reposts: 89
    },
    {
      id: 2,
      username: 'crypto_alice',
      handle: '@alice_blockchain',
      avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
      content: 'Just deployed my first smart contract on Monad! The developer experience is amazing. 10x faster than anything I\'ve used before.',
      time: '5h',
      likes: 123,
      comments: 15,
      reposts: 21
    },
    {
      id: 3,
      username: 'defi_whale',
      handle: '@whale_watcher',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'The TVL on Monad DeFi protocols has grown 300% this month alone. This is just the beginning! 📈 #DeFi #Monad',
      time: '1d',
      likes: 542,
      comments: 87,
      reposts: 156
    },
    {
      id: 4,
      username: 'defi_whale',
      handle: '@whale_watcher',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'The TVL on Monad DeFi protocols has grown 300% this month alone. This is just the beginning! 📈 #DeFi #Monad',
      time: '1d',
      likes: 542,
      comments: 87,
      reposts: 156
    },
    {
      id: 5,
      username: 'defi_whale',
      handle: '@whale_watcher',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'The TVL on Monad DeFi protocols has grown 300% this month alone. This is just the beginning! 📈 #DeFi #Monad',
      time: '1d',
      likes: 542,
      comments: 87,
      reposts: 156
    }
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!activeWallet) return;

      try {
        const response = await fetch(`/api/users/${activeWallet.address}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        console.log("User data fetched:", data);
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [activeWallet]);

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    
    try {
      const response = await fetch('/api/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: postContent }),
      });
      let data = await response.json();
      console.log(data);
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xccb869b793b231db5a2aa7c1bbcb5297dc3f6288",
          value: "0x0",
          data: data.data,
          from: activeWallet.address,
          gasLimit: 175000
        }],
      });
      console.log("Transaction sent:", txHash);
      // setPosts([newPost, ...posts]);
      setPostContent('');
      toast.success(
        <div>
          Successfully created account! 
          <a 
            href={`https://monad-testnet.socialscan.io/tx/${txHash}`} 
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
      await fetch(`/api/create-post?txn=${txHash}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className={styles.twitterLayout}>
      <ToastContainer theme="dark" />
      
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.logo}>MonadSocial</h1>
      </div>
      
      <div className={styles.mainContainer}>
        {/* Left Column - Home label */}
        <div className={styles.leftColumn}>
          <div className={styles.homeLabel}>Home</div>
          
          {/* User Input Area */}
          <div className={styles.userInputArea}>
            <div className={styles.userAvatar}>
              <img 
                src={userData?.user?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                alt="Your avatar" 
              />
            </div>
            <div className={styles.inputWrapper}>
              <textarea 
                placeholder="What's happening?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                maxLength={280}
              />
              
              <div className={styles.inputActions}>
                <div className={styles.mediaButtons}>
                  <button type="button"><FaImage /></button>
                  <button type="button"><FaGift /></button>
                  <button type="button"><FaPoll /></button>
                  <button type="button"><FaSmile /></button>
                  <button type="button"><FaCalendar /></button>
                </div>
                <button 
                  onClick={handlePostSubmit}
                  className={styles.postButton}
                  disabled={!postContent.trim() || isPosting}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
          
          {/* Feed */}
          <div className={styles.feed}>
            {posts.map(post => (
              <div key={post.id} className={styles.post}>
                <div className={styles.postAvatar}>
                  <img src={post.avatar} alt={`${post.username}'s avatar`} />
                </div>
                <div className={styles.postContent}>
                  <div className={styles.postHeader}>
                    <span className={styles.postUsername}>{post.username}</span>
                    <span className={styles.postHandle}>{post.handle}</span>
                    <span className={styles.postTime}>· {post.time}</span>
                  </div>
                  <div className={styles.postText}>
                    {post.content}
                  </div>
                  <div className={styles.postActions}>
                    <button><FaComment /> <span>{post.comments}</span></button>
                    <button><FaRetweet /> <span>{post.reposts}</span></button>
                    <button><FaHeart /> <span>{post.likes}</span></button>
                    <button><FaShareSquare /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Column - Navigation */}
        <div className={styles.rightColumn}>
          <nav className={styles.mainNav}>
            <ul>
              <li className={styles.active}><FaHome /> <span>Home</span></li>
              <li><FaSearch /> <span>Explore</span></li>
              <li><FaBell /> <span>Notifications</span></li>
              <li><FaEnvelope /> <span>Messages</span></li>
              <li><FaBookmark /> <span>Bookmarks</span></li>
              <li><FaList /> <span>Lists</span></li>
              <li><FaUser /> <span>Profile</span></li>
              <li><FaEllipsisH /> <span>More</span></li>
            </ul>
          </nav>
          
          <div className={styles.postButtonLarge}>
            <button>Post</button>
          </div>
          
          {/* User Info Box */}
          <div className={styles.userInfoBox}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {userData?.user?.username || 'nemo'}
              </div>
              <div className={styles.userAddress}>
                {activeWallet ? `${activeWallet.address.substring(0, 6)}...${activeWallet.address.substring(activeWallet.address.length - 4)}` : '0xD4D...604B'}
              </div>
            </div>
            
            <button onClick={logout} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 