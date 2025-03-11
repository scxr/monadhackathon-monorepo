'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import styles from './Dashboard.module.css';
import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { FaHome, FaSearch, FaBell, FaEnvelope, FaBookmark, FaList, FaUser, FaEllipsisH, FaImage, FaGift, FaPoll, FaSmile, FaCalendar, FaRetweet, FaHeart, FaShareSquare, FaComment, FaEdit, FaSignOutAlt, FaShoppingCart, FaInfo, FaTimes, FaSpinner } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define the Post type
interface Post {
  id: number;
  username: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  author: string;

  comments: {
    commentCount: number;
    comments: string[];
  }
  reposts: number;
  postId: string | number;
  user: {
    username: string;
    id: string;
    address: string;
    pfpLink: string;
  }
  likes: {
    likeCount: number;
    likers: string[];
  }
}

// Define the TokenInfo type
interface TokenInfo {
  supply: string;
  parsedSupply: number;
  decimals: number;
  name: string;
  symbol: string;
  price: string;
}

export function Dashboard() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const postIdsRef = useRef<Set<string>>(new Set());
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeWallet = wallets[0];
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [showBuyPopup, setShowBuyPopup] = useState(false);
  const [infoButtonPosition, setInfoButtonPosition] = useState({ top: 0, left: 0 });
  const [buyButtonPosition, setBuyButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState("0.01");
  const [slippage, setSlippage] = useState("10");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buyPopupRef = useRef<HTMLDivElement>(null);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderCollapsed(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const POSTS_PER_PAGE = 20;

  const fetchPosts = async (currentOffset: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      let url = `/api/get-posts?offset=${currentOffset}&limit=${POSTS_PER_PAGE}`;
      
      // If feed type is 'following', use the following posts endpoint
      if (feedType === 'following' && activeWallet) {
        url = `/api/get-following-posts?offset=${currentOffset}&limit=${POSTS_PER_PAGE}&address=${activeWallet.address}`;
      }
      
      console.log(`Fetching posts from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${feedType} posts`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      
      const validPosts: Post[] = [];
      
      for (let i = 0; i < data.length; i++) {
        console.log(data[i]);
        if (data[i].postId) {
          const postIdStr = data[i].postId.toString();
          // Check if this post ID is already in our tracked IDs
          if (!postIdsRef.current.has(postIdStr)) {
            // Create a properly structured post object
            const post = {
              ...data[i],
              likes: {
                likeCount: Number(data[i].likes?.likeCount) || 0,
                likers: data[i].likes?.likers || []
              }
            };
            validPosts.push(post);
            // Add to our Set of tracked IDs
            postIdsRef.current.add(postIdStr);
          }
        }
      }
      
      // Only add posts that aren't duplicates
      setPosts(prevPosts => [...prevPosts, ...validPosts]);
      setOffset(currentOffset + POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset posts when component mounts or feed type changes
  useEffect(() => {
    // Clear existing posts and IDs when component mounts or feed type changes
    setPosts([]);
    postIdsRef.current = new Set();
    setOffset(0);
    setHasMore(true);
    fetchPosts(0);
  }, [feedType]);

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

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) {
          fetchPosts(offset);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [offset, hasMore, isLoading]);

  // Close popups when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (popupRef.current && !popupRef.current.contains(event.target as Node)) &&
        (buyPopupRef.current && !buyPopupRef.current.contains(event.target as Node))
      ) {
        setShowTokenInfo(false);
        setShowBuyPopup(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        body: JSON.stringify({ content: postContent, author: activeWallet.address }),
      });
      let data = await response.json();
      console.log(`Post created: ${JSON.stringify(data)}`);
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          value: "0x0",
          data: data.data,
          from: activeWallet.address,
          gasLimit: data.gasEstimate
        }],
      });
      console.log("Transaction sent:", txHash);
      setPostContent('');
      toast.success(
        <div>
          Successfully created post! 
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
      
      // Refresh the posts after creating a new one
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      fetchPosts(0);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      let post = posts.find(post => post.postId.toString() === postId);
      if (!post) {
        toast.error('Post not found');
        return;
      }
      if (post.likes.likers.includes(activeWallet.address)) {
        toast.error('You already liked this post');
        return;
      }
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          value: "0x0",
          data: data.transactionData,
          from: activeWallet.address,
          gasLimit: 175000
        }],
      });
      
      // Update the UI optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.postId.toString() === postId
            ? {
                ...post,
                likes: {
                  likeCount: post.likes.likeCount + 1,
                  likers: [...post.likes.likers, activeWallet.address]
                }
              }
            : post
        )
      );

      console.log("Post liked:", data);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post. Please try again.');
    }
  };

  // Function to check if text contains an Ethereum address
  const containsEthereumAddress = (text: string): string | null => {
    // Regex to match Ethereum addresses (0x followed by 40 hex characters)
    const ethAddressRegex = /0x[a-fA-F0-9]{40}/g;
    const match = text.match(ethAddressRegex);
    return match ? match[0] : null;
  };

  // Function to handle buy action
  const handleBuy = async (e: React.MouseEvent, address: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the position of the clicked button for positioning the popup
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setBuyButtonPosition({
      top: buttonRect.top + window.scrollY,
      left: buttonRect.left + window.scrollX + (buttonRect.width / 4)
    });
    
    setSelectedAddress(address);
    setShowBuyPopup(true);
    
    // Reset purchase form
    setPurchaseAmount("0.01");
    setSlippage("10");
    setIsPurchasing(false);
  };

  // Function to handle purchase confirmation
  const handleConfirmPurchase = async () => {
    if (!selectedAddress) return;
    
    setIsPurchasing(true);
    
    try {
      // Simulate API call with 5 second delay
      // await new Promise(resolve => setTimeout(resolve, 5000));

      let response = await fetch(`/api/purchase`, {
        method: "POST",
        body: JSON.stringify({
          address: selectedAddress,
          amount: purchaseAmount,
          userAddress: activeWallet.address
        })
      });

      let data = await response.json();
      console.log(data);

      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: data.data.to,
          gas: data.data.gas,
          gasPrice: data.data.gasPrice,
          data: data.data.data,
          from: activeWallet.address,
          value: data.data.value
        }],
      });

      console.log("Transaction sent:", txHash);
      
      
      
      // toast.success(`Successfully purchased ${purchaseAmount} MON tokens!`);
      toast.success(
        <div>
          Successfully purchased {purchaseAmount} MON tokens!
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
      
      setShowBuyPopup(false);
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Function to close the buy popup
  const closeBuyPopup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBuyPopup(false);
  };

  // Function to fetch token info
  const fetchTokenInfo = async (address: string): Promise<TokenInfo> => {
    // For now, return mock data as specified
    // In a real implementation, this would make an API call to the backend
    const response = await fetch(`/api/token-info/${address}`);
    const data = await response.json();
    return {
      "supply": data.supply,
      "parsedSupply": data.parsedSupply,
      "decimals": data.decimals,
      "name": data.name,
      "symbol": data.symbol,
      "price": data.price
    };
  };

  // Function to handle info action
  const handleInfo = async (e: React.MouseEvent, address: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the position of the clicked button for positioning the popup
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setInfoButtonPosition({
      top: buttonRect.top + window.scrollY,
      left: buttonRect.left + window.scrollX + (buttonRect.width / 2)
    });
    
    setSelectedAddress(address);
    
    try {
      const info = await fetchTokenInfo(address);
      setTokenInfo(info);
      setShowTokenInfo(true);
    } catch (error) {
      console.error('Error fetching token info:', error);
      toast.error('Failed to fetch token information');
    }
  };

  // Function to close the token info popup
  const closeTokenInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTokenInfo(false);
  };

  return (
    <>
      {/* Fixed Header */}
      <header className={`${styles.header} ${isHeaderCollapsed ? styles.headerCollapsed : styles.headerExpanded}`}>
        <div className={styles.headerContent}>
          <nav className={styles.nav}>
            <Link href="/" className={`${styles.navItem} ${styles.active}`}>
              <FaHome size={18} /> {!isHeaderCollapsed && "Home"}
            </Link>
            <Link href="/create" className={styles.navItem}>
              <FaEdit size={18} /> {!isHeaderCollapsed && "Post"}
            </Link>
            <Link href="/profile" className={styles.navItem}>
              <FaUser size={18} /> {!isHeaderCollapsed && "Profile"}
            </Link>
            <button onClick={logout} className={styles.navItem}>
              <FaSignOutAlt size={18} /> {!isHeaderCollapsed && "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <div className={styles.twitterLayout}>
        <ToastContainer theme="dark" />
        
        {/* Token Info Popup */}
        {showTokenInfo && tokenInfo && (
          <div 
            className={styles.tokenInfoPopup} 
            style={{ 
              top: `${infoButtonPosition.top - 220}px`, 
              left: `${infoButtonPosition.left - 125}px` 
            }}
            ref={popupRef}
          >
            <div className={styles.tokenInfoHeader}>
              <h3>Token Info</h3>
              <button className={styles.closeButton} onClick={closeTokenInfo}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.tokenInfoContent}>
              <div className={styles.tokenInfoRow}>
                <span className={styles.tokenInfoLabel}>Name:</span>
                <span className={styles.tokenInfoValue}>{tokenInfo.name}</span>
              </div>
              <div className={styles.tokenInfoRow}>
                <span className={styles.tokenInfoLabel}>Symbol:</span>
                <span className={styles.tokenInfoValue}>{tokenInfo.symbol}</span>
              </div>
              <div className={styles.tokenInfoRow}>
                <span className={styles.tokenInfoLabel}>Price:</span>
                <span className={styles.tokenInfoValue}>${tokenInfo.price}</span>
              </div>
              <div className={styles.tokenInfoRow}>
                <span className={styles.tokenInfoLabel}>Decimals:</span>
                <span className={styles.tokenInfoValue}>{tokenInfo.decimals}</span>
              </div>
              <div className={styles.tokenInfoRow}>
                <span className={styles.tokenInfoLabel}>Supply:</span>
                <span className={styles.tokenInfoValue}>{Number(tokenInfo.parsedSupply).toLocaleString()}</span>
              </div>
            </div>
            <div className={styles.tokenInfoArrow}></div>
          </div>
        )}
        
        {/* Buy Popup */}
        {showBuyPopup && (
          <div 
            className={styles.buyPopup} 
            style={{ 
              top: `${buyButtonPosition.top - 220}px`, 
              left: `${buyButtonPosition.left - 125}px` 
            }}
            ref={buyPopupRef}
          >
            <div className={styles.buyPopupHeader}>
              <h3>Buy Tokens</h3>
              <button className={styles.closeButton} onClick={closeBuyPopup}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.buyPopupContent}>
              <div className={styles.inputGroup}>
                <label htmlFor="amount">Amount:</label>
                <div className={styles.inputWithUnit}>
                  <input 
                    id="amount"
                    type="number" 
                    value={purchaseAmount} 
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    disabled={isPurchasing}
                  />
                  <span className={styles.inputUnit}>MON</span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="slippage">Slippage:</label>
                <div className={styles.inputWithUnit}>
                  <input 
                    id="slippage"
                    type="number" 
                    value={slippage} 
                    onChange={(e) => setSlippage(e.target.value)}
                    disabled={isPurchasing}
                  />
                  <span className={styles.inputUnit}>%</span>
                </div>
              </div>
              <button 
                className={styles.confirmButton}
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <FaSpinner className={styles.spinner} /> 
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
            <div className={styles.buyPopupArrow}></div>
          </div>
        )}
        
        <div className={styles.mainContainer}>
          {/* Left Column - User Info */}
          <div className={styles.leftSidebarColumn}>
            {/* User Info Box */}
            <div className={styles.userInfoBox}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {userData?.user?.username || 'nemo'}
                </div>
                <div className={styles.userAddress}>
                  <a href={`https://testnet.monadexplorer.com/address/${activeWallet.address}`} target="_blank" rel="noopener noreferrer">{activeWallet ? `${activeWallet.address.substring(0, 6)}...${activeWallet.address.substring(activeWallet.address.length - 4)}` : '0xD4D...604B'}</a>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Home and Feed */}
          <div className={styles.centerColumn}>
            <div className={styles.homeLabel}>
              <h2>Home</h2>
            </div>

            {/* Post Input */}
            <div className={styles.userInputArea}>
              <div className={styles.userAvatar}>
                <img src={userData?.user?.pfpLink || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="User avatar" />
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

            {/* Feed Toggle */}
            <div className={styles.feedToggle}>
              <button 
                className={`${styles.toggleButton} ${feedType === 'all' ? styles.active : ''}`}
                onClick={() => setFeedType('all')}
              >
                All
              </button>
              <button 
                className={`${styles.toggleButton} ${feedType === 'following' ? styles.active : ''}`}
                onClick={() => setFeedType('following')}
              >
                Following
              </button>
            </div>

            {/* Feed */}
            <div className={styles.feed}>
              {posts.length === 0 && !isLoading && (
                <div className={styles.noPostsMessage}>
                  {feedType === 'following' 
                    ? "You're not following anyone yet, or the people you follow haven't posted anything." 
                    : "No posts to show. Be the first to post!"}
                </div>
              )}
              {posts.map(post => {
                const ethAddress = containsEthereumAddress(post.content);
                
                return (
                  <Link href={`/post/${post.postId}`} key={post.postId} className={styles.postLink}>
                    <div className={styles.post}>
                      <div className={styles.postAvatar} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/profile/${post.author}`);
                      }}>
                        <img src={post.user.pfpLink == "https://placeholder.com" ? "https://randomuser.me/api/portraits/lego/1.jpg" : post.user.pfpLink || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={`${post.user.username}'s avatar`} />
                      </div>
                      <div className={styles.postContent}>
                        <div className={styles.postHeader}>
                          <span 
                            className={styles.postUsername}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/profile/${post.author}`);
                            }}
                          >{post.user.username}</span>
                          <span className={styles.postHandle}>{post.handle}</span>
                          <span className={styles.postTime}>· {post.time}</span>
                        </div>
                        <div className={styles.postText}>
                          {post.content}
                        </div>
                        
                        {/* Buy and Info buttons for Ethereum addresses */}
                        {ethAddress && (
                          <div className={styles.actionButtonsContainer}>
                            <button 
                              className={styles.buyButton}
                              onClick={(e) => handleBuy(e, ethAddress)}
                              data-address={ethAddress}
                            >
                              <FaShoppingCart /> Buy
                            </button>
                            <button 
                              className={styles.infoButton}
                              onClick={(e) => handleInfo(e, ethAddress)}
                              data-address={ethAddress}
                            >
                              <FaInfo /> Info
                            </button>
                          </div>
                        )}
                        
                        <div className={styles.postActions}>
                          <button onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}><FaComment /> <span>{post.comments.commentCount}</span></button>
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLikePost(post.postId.toString());
                            }}
                            className={post.likes.likers.includes(activeWallet.address) ? styles.likedButton : ''}
                          >
                            <FaHeart /> <span>{post.likes.likeCount}</span>
                          </button>
                          <button onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // copy link to clipboard
                            navigator.clipboard.writeText(`${window.location.origin}/post/${post.postId}`);
                            toast.success('Link copied to clipboard');
                          }}><FaShareSquare /></button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Loading indicator */}
              <div ref={loadingRef} className={styles.loadingIndicator}>
                {isLoading && <div className={styles.spinner}>Loading...</div>}
                {!hasMore && <div className={styles.noMorePosts}>No more posts</div>}
              </div>
            </div>
          </div>

          {/* Right Column - Empty */}
          <div className={styles.rightSidebarColumn}>
            {/* This column is intentionally left empty */}
          </div>
        </div>
      </div>
    </>
  );
} 